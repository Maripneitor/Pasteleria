const { User, ActivationCode, sequelize } = require('../models');
const { Op } = require('sequelize');

exports.generateCode = async (req, res) => {
    try {
        const { tenantId, id: ownerId, role, maxUsers } = req.user;

        // 1. Verify Permission (Admin or Owner)
        // Normalized roles: SUPER_ADMIN, ADMIN, OWNER, EMPLOYEE, USER
        if (!['ADMIN', 'SUPER_ADMIN', 'OWNER'].includes(role)) {
            return res.status(403).json({ message: 'No tienes permiso para generar códigos.' });
        }

        // 2. Check Limits (Owner Only)
        if (role === 'OWNER') {
            const activeUsersCount = await User.count({ where: { ownerId, status: 'ACTIVE' } });
            if (activeUsersCount >= maxUsers) {
                return res.status(403).json({
                    message: `Límite de usuarios alcanzado (${activeUsersCount}/${maxUsers}). No puedes activar más cuentas.`
                });
            }
        }

        // 3. Validation: Branch IS REQUIRED for employees
        const targetBranchId = req.body.branchId || req.user.branchId;
        if (!targetBranchId && req.body.role !== 'OWNER' && req.body.role !== 'ABMIN') {
            // Exception: Owners generating codes for other Owners? (Unlikely workflow, usually manual)
            // Strict Rule: Activation Code MUST bind to a branch unless it's a special SuperAdmin case.
            // User Request says: "Generar ActivationCode sin branch_id -> FAIL" implies strictness.
            return res.status(400).json({ message: 'El código de activación debe estar asociado a una sucursal.' });
        }

        // 4. Generate Code (6 digits)
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        // 5. Save
        const newCode = await ActivationCode.create({
            code,
            ownerId: req.user.id,
            tenantId: req.user.tenantId || req.body.tenantId || 0,
            branchId: targetBranchId || null,
            targetRole: req.body.role || 'USER',
            expiresAt
        });

        res.json({
            ok: true,
            code: newCode.code,
            expiresAt: newCode.expiresAt,
            message: 'Código generado correctamente.'
        });

    } catch (e) {
        console.error("GenerateCode Error:", e);
        res.status(500).json({ message: 'Error generando código', error: e.message });
    }
};

exports.verifyCode = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { code } = req.body;
        const userId = req.user.id; // From PENDING session token

        const activationEntry = await ActivationCode.findOne({
            where: {
                code,
                status: 'UNUSED',
                expiresAt: { [Op.gt]: new Date() } // Not expired
            },
            transaction: t
        });

        if (!activationEntry) {
            await t.rollback();
            return res.status(400).json({ message: 'Código inválido o expirado.' });
        }

        // Check limit again (Race condition safety)
        const owner = await User.findByPk(activationEntry.ownerId, { transaction: t });
        // Assume owner exists. If owner enforces limit:
        if (owner && ['OWNER', 'ADMIN', 'SUPER_ADMIN'].includes(owner.globalRole?.toUpperCase())) {
            const currentCount = await User.count({
                where: { ownerId: owner.id, status: 'ACTIVE' },
                transaction: t
            });
            if (currentCount >= owner.maxUsers) {
                await t.rollback();
                return res.status(409).json({ message: 'El dueño de este código ha alcanzado su límite de usuarios.' });
            }
        }

        // Activate User
        let userRole = activationEntry.targetRole || 'USER';
        // Fix: DB ENUM only supports SUPER_ADMIN, ADMIN, USER. 
        // Logic: USER + ownerId = EMPLOYEE. 
        if (userRole === 'EMPLOYEE' || userRole === 'employee') {
            userRole = 'USER';
        }

        await User.update({
            status: 'ACTIVE',
            tenantId: activationEntry.tenantId,
            branchId: activationEntry.branchId, // Link branch
            ownerId: activationEntry.ownerId, // Link hierarchy
            globalRole: userRole.toUpperCase() // Default to USER
        }, { where: { id: userId }, transaction: t });

        // Mark Code Used
        await activationEntry.update({
            status: 'USED',
            usedAt: new Date(),
            usedByUserId: userId
        }, { transaction: t });

        await t.commit();
        res.json({ ok: true, message: 'Cuenta activada correctamente. Bienvenido.' });

    } catch (e) {
        await t.rollback();
        console.error("VerifyCode Error:", e);
        res.status(500).json({ message: 'Error activando cuenta', error: e.message });
    }
};
