const { User, sequelize } = require('../models');
const UserSession = require('../models/UserSession');
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Función para REGISTRAR un nuevo usuario
exports.register = async (req, res) => {
  try {
    const { username, email, password, globalRole, tenantId } = req.body;

    // Encriptamos la contraseña antes de guardarla
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      username,
      email,
      password: hashedPassword, // Guardamos la contraseña encriptada
      globalRole: globalRole || 'USER',
      tenantId: tenantId || null,
      status: 'PENDING'
    });

    // Validar si el endpoint es público o admin-only.
    // Si es público, status es PENDING. Si lo crea un Admin autenticado, podría ser ACTIVE (future improvement).

    // Excluimos la contraseña de la respuesta por seguridad
    const userResponse = newUser.toJSON();
    delete userResponse.password;

    res.status(201).json({ message: "Registro exitoso. Tu cuenta está pendiente de activación.", user: userResponse });
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ message: 'El email ya está registrado.' });
    }
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
};

// Función para INICIAR SESIÓN
exports.login = async (req, res) => {
  try {
    const { email, username, password } = req.body;

    if (!password || (!email && !username)) {
      return res.status(400).json({ message: 'Credenciales incompletas.' });
    }

    // 1. Buscar al usuario por email O username
    const user = await User.findOne({
      where: sequelize.or(
        { email: email || '' },
        { username: username || (email || '') }
      )
    });

    if (!user) {
      return res.status(401).json({ message: 'Credenciales inválidas.' });
    }

    // 2. Comparar la contraseña
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Credenciales inválidas.' });
    }

    // --- Status Check ---
    if (user.status !== 'ACTIVE') {
      if (user.status === 'BLOCKED') return res.status(403).json({ message: 'Cuenta bloqueada.' });

      // Pending activation logic
      const tempPayload = { id: user.id, role: 'guest', status: 'PENDING' };
      const tempToken = jwt.sign(tempPayload, process.env.JWT_SECRET, { expiresIn: '1h' });

      return res.status(403).json({
        message: 'Cuenta pendiente de activación.',
        code: 'ACCOUNT_PENDING',
        tempToken: tempToken
      });
    }

    // --- Session Handling (Fix: TTL + Cleanup) ---
    // A) Primero limpiamos sesiones muertas/viejas para este usuario
    await deactivateExpiredSessions(user.id);

    // B) Verificar si YA tiene sesión activa (que esté dentro del TTL)
    //    Si lastSeenAt es reciente, sigue siendo un bloqueo válido (multi-dispositivo).
    const activeSession = await UserSession.findOne({
      where: {
        userId: user.id,
        isActive: true
        // Opcional: Podríamos validar expiresAt > now, pero deactivateExpiredSessions ya se encargó de las viejas via lastSeenAt
      }
    });

    if (activeSession) {
      // Bloqueo estricto multi-sesión
      return res.status(409).json({
        message: 'Ya tienes una sesión activa en otro dispositivo.',
        code: 'DUPLICATE_SESSION'
      });
    }

    // 3. Crear Token (JWT)
    const payload = {
      id: user.id,
      username: user.username,
      globalRole: user.globalRole,
      tenantId: user.tenantId
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '8h' });
    // Usamos una firma simple o parte del token para identificarlo en BD
    // En producción ideal: hash del token. Aquí usaremos "tokenSignature" como identificador.
    // Para simplificar y matchear con middleware, podríamos guardar los últimos chars o el propio token (cuidado con longitud).
    // El prompt sugiere: "tokenSignature". Usaremos el token real truncado o algo único. 
    // AuthMiddleware valida JWT decode, así que si guardamos identificador, necesitamos pasar ese id en el token? 
    // No, el prompt dice: "where: { userId: req.user.id, tokenSignature, isActive: true }".
    // PERO authMiddleware recibe el token entero. 
    // Asumiremos tokenSignature = token (o substring) y que authMiddleware lo puede derivar.
    // Para no romper, guardaremos una substring final del token como firma.
    const tokenSignature = token.slice(-20);

    // Registramos la sesión
    await UserSession.create({
      userId: user.id,
      tokenSignature: tokenSignature,
      ip: req.ip,
      deviceInfo: req.headers['user-agent'] || 'unknown',
      isActive: true,
      lastSeenAt: new Date(),
      expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000) // 8 horas hard limit
    });

    res.status(200).json({
      message: "Inicio de sesión exitoso",
      token: token,
      user: {
        id: user.id,
        username: user.username,
        role: user.globalRole,
        tenantId: user.tenantId,
        ownerId: user.ownerId,
        status: user.status
      }
    });

  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
};

// Función para Logout
exports.logout = async (req, res) => {
  try {
    const token = req.header('Authorization')?.split(' ')[1];
    if (!token) return res.status(200).json({ message: 'Logout ok (no token)' }); // Idempotente

    // Necesitamos identificar la sesión.
    // Si el middleware ya corrió, tenemos req.user
    if (req.user) {
      const tokenSignature = token.slice(-20);
      await UserSession.update(
        { isActive: false },
        { where: { userId: req.user.id, tokenSignature, isActive: true } }
      );
    }
    res.status(200).json({ message: 'Sesión cerrada correctamente.' });
  } catch (error) {
    console.error('Logout Error:', error);
    res.status(500).json({ message: 'Error al cerrar sesión' });
  }
};


// --- Helper: Session Cleanup ---
const SESSION_TTL_MIN = Number(process.env.SESSION_TTL_MIN || 20);

async function deactivateExpiredSessions(userId) {
  try {
    const ttlMs = SESSION_TTL_MIN * 60 * 1000;
    const cutoff = new Date(Date.now() - ttlMs);
    const { Op } = require('sequelize');

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

exports.getMe = async (req, res) => {
  try {
    const { User } = require('../models'); // Ensure User model is available
    // req.user is set by authMiddleware
    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'username', 'email', 'globalRole', 'tenantId', 'ownerId', 'status']
    });

    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    res.json({
      id: user.id,
      name: user.username,
      email: user.email,
      role: user.globalRole,
      tenantId: user.tenantId,
      ownerId: user.ownerId
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al obtener perfil" });
  }
};