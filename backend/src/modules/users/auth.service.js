const { User, sequelize } = require('../../../models');
const UserSession = require('../../../models/UserSession');
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const SESSION_TTL_MIN = Number(process.env.SESSION_TTL_MIN || 20);

// Helper: Determine Effective Role
function getEffectiveRole(user) {
    const role = (user.role || '').toUpperCase();

    // 1. Si el rol es uno de los 3 oficiales nuevos, lo pasamos directo
    if (['SUPER_ADMIN', 'OWNER', 'EMPLOYEE'].includes(role)) {
        return role;
    }

    // 2. Lógica Legacy (Soporte para datos viejos que no se hayan actualizado)
    if (role === 'ADMIN') return 'SUPER_ADMIN'; // Los viejos admins ahora son Super Admins
    if (role === 'USER') {
        // Si tienen un jefe asignado, son empleados. Si no, son dueños.
        if (user.ownerId) return 'EMPLOYEE';
        return 'OWNER';
    }

    // Fallback más seguro a nivel operativo
    return 'EMPLOYEE'; 
}

// Helper: Session Cleanup
async function deactivateExpiredSessions(userId) {
    try {
        const ttlMs = SESSION_TTL_MIN * 60 * 1000;
        const cutoff = new Date(Date.now() - ttlMs);

        // Desactivar sesiones que a pesar de estar isActive=true, no se han visto en X tiempo
        await UserSession.update(
            { isActive: false },
            {
                where: {
                    userId,
                    isActive: true,
                    lastSeenAt: { [Op.lt]: cutoff }
                }
            }
        );
    } catch (e) {
        console.error('Error cleaning sessions:', e);
    }
}

class AuthService {
    async register({ name, email, password, role, tenantId }) { // Changed username to name, globalRole to role
        // Encrypt password
        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await User.create({
            name, 
            email,
            password: hashedPassword,
            // Forzamos el rol de SUPER_ADMIN y el tenantId 1 para desarrollo
            role: role || 'SUPER_ADMIN', 
            tenantId: tenantId || 1,
            status: 'ACTIVE'
        });

        const userResponse = newUser.toJSON();
        delete userResponse.password;

        return userResponse;
    }

    async login({ email, name, password, ip, userAgent }) { // Changed username to name
        // Sanitize inputs
        const cleanEmail = email ? email.trim().toLowerCase() : '';
        const cleanName = name ? name.trim() : ''; // Changed cleanUsername to cleanName

        // 1. Find User with Organization and Branch info
        // We use string alias as defined in models/index.js
        const user = await User.findOne({
            where: sequelize.or(
                { email: cleanEmail || '' },
                { name: cleanName || (cleanEmail || '') } // Changed username to name
            ),
            include: [
                { association: 'organization' },
                { association: 'assignedBranch' }
            ]
        });

        if (!user) {
            console.log('❌ Login failed: User not found for email/name', { email, name }); // Fixed: username → name
            throw { status: 401, code: 'INVALID_CREDENTIALS', message: 'Correo o contraseña incorrectos.' };
        }

        console.log('✅ User found:', { id: user.id, email: user.email, storedHash: user.password });

        // 2. Compare Password
        const isMatch = await bcrypt.compare(password, user.password);
        console.log('🔐 Password Comparison:', { inputPasswordLength: password ? password.length : 0, isMatch });

        if (!isMatch) {
            console.log('❌ Login failed: Password mismatch');
            throw { status: 401, code: 'INVALID_CREDENTIALS', message: 'Correo o contraseña incorrectos.' };
        }

        // 3. Status Check
        if (user.status !== 'ACTIVE') {
            if (user.status === 'BLOCKED') {
                throw { status: 403, code: 'ACCOUNT_BLOCKED', message: 'Cuenta bloqueada.' };
            }

            if (!process.env.JWT_SECRET) {
                throw { status: 503, code: 'SERVICE_UNAVAILABLE', message: 'Servicio temporalmente no disponible (JWT_SECRET).' };
            }

            const tempPayload = { id: user.id, role: 'guest', status: 'PENDING' };
            const tempToken = jwt.sign(tempPayload, process.env.JWT_SECRET, { expiresIn: '1h' });

            throw {
                status: 403,
                code: 'ACCOUNT_PENDING',
                message: 'Cuenta pendiente de activación.',
                data: { tempToken }
            };
        }

        // 4. Session Handling
        await deactivateExpiredSessions(user.id);

        const activeSession = await UserSession.findOne({
            where: { userId: user.id, isActive: true }
        });

        const isDuplicateSessionBlockEnabled = process.env.DUPLICATE_SESSION_BLOCK_ENABLED === 'true';

        if (isDuplicateSessionBlockEnabled && activeSession) {
            throw { status: 409, code: 'DUPLICATE_SESSION', message: 'Ya tienes una sesión activa en otro dispositivo.' };
        }

        // 5. Create Token
        const payload = {
            id: user.id,
            name: user.name, // Changed username -> name
            role: user.role, // Changed globalRole -> role
            tenantId: user.tenantId,
            branchId: user.branchId, // Added
            ownerId: user.ownerId
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '8h' });
        const tokenSignature = token.slice(-20);

        await UserSession.create({
            userId: user.id,
            tokenSignature: tokenSignature,
            ip: ip,
            deviceInfo: userAgent || 'unknown',
            isActive: true,
            lastSeenAt: new Date(),
            expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000)
        });

        const effectiveRole = getEffectiveRole(user);

        return {
            message: "Inicio de sesión exitoso",
            token,
            user: {
                id: user.id,
                name: user.name, // Changed username -> name
                role: effectiveRole,
                tenantId: user.tenantId,
                branchId: user.branchId,
                ownerId: user.ownerId,
                status: user.status
            },
            tenant: user.organization, // Inyected
            branch: user.assignedBranch  // Inyected
        };
    }

    async logout(token, userId) {
        if (!token) return;
        const tokenSignature = token.slice(-20);

        await UserSession.update(
            { isActive: false },
            { where: { userId, tokenSignature, isActive: true } }
        );
    }

    async getMe(userId) {
        const user = await User.findByPk(userId, {
            attributes: ['id', 'name', 'email', 'role', 'tenantId', 'ownerId', 'status']
        });

        if (!user) throw { status: 404, message: 'Usuario no encontrado' };

        const effectiveRole = getEffectiveRole(user);

        return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: effectiveRole,
            tenantId: user.tenantId,
            ownerId: user.ownerId,
            status: user.status
        };
    }
}

module.exports = new AuthService();
