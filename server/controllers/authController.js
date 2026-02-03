const { User, sequelize } = require('../models');
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
      globalRole: globalRole || 'employee',
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
      // Retornar 401 genérico para no filtrar usuarios
      return res.status(401).json({ message: 'Credenciales inválidas.' });
    }

    // 2. Comparar la contraseña enviada con la encriptada en la BD
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Credenciales inválidas.' });
    }

    // --- Sprint 4: Status Check ---
    if (user.status !== 'ACTIVE') {
      if (user.status === 'BLOCKED') return res.status(403).json({ message: 'Cuenta bloqueada.' });

      // If PENDING, we ALLOW login but return a special flag so frontend can redirect to Lock Page
      // OR we return 403 with specific code.
      // User requested: "responder 403 con { code: 'ACCOUNT_PENDING' }"

      // BUT if we return 403, the frontend needs to know WHO it is to verify later?
      // Actually verify takes a token. So we might need a "Temporary Token" or allow login with restricted scope.
      // Let's issue a token but with scope='activation_only' or similar?
      // The implementation plan says: "Login blocks... Code ACCOUNT_PENDING".
      // Use case: User registers -> Responds 201.
      // User logs in -> 403 ACCOUNT_PENDING.
      // Then Verification endpoint `verifyCode` needs `req.user.id`. 
      // HOW do we id the user if they can't login?

      // Solucion: "POST /api/auth/login" returns 403 BUT includes a `tempToken`?
      // OR we permit login (200) but frontend handles the redirect?
      // The prompt says: "Si user.status != ACTIVE → responder 403 con { code: "ACCOUNT_PENDING" }"
      // AND "verifyCode" uses "req.user.id".
      // This implies we DO need a token.
      // I will issue a temporary token in the 403 response payload.

      const tempPayload = { id: user.id, role: 'guest', status: 'PENDING' };
      const tempToken = jwt.sign(tempPayload, process.env.JWT_SECRET, { expiresIn: '1h' });

      return res.status(403).json({
        message: 'Cuenta pendiente de activación.',
        code: 'ACCOUNT_PENDING',
        tempToken: tempToken
      });
    }

    const UserSession = require('../models/UserSession');
    const { Op } = require('sequelize');

    // ... inside login function ...

    // --- Sprint 4: Session Guard ---
    // Check if there is an ACTIVE and VALID session
    const activeSession = await UserSession.findOne({
      where: {
        userId: user.id,
        isActive: true,
        expiresAt: { [Op.gt]: new Date() } // Not expired
      }
    });

    if (activeSession) {
      return res.status(409).json({
        message: 'Ya tienes una sesión activa en otro dispositivo.',
        code: 'DUPLICATE_SESSION'
      });
    }

    // 3. Si todo es correcto, crear un Token (JWT)
    const payload = {
      id: user.id,
      username: user.username,
      role: user.globalRole ? user.globalRole.toLowerCase() : 'user',
      tenantId: user.tenantId
    };

    // Se utiliza la variable de entorno JWT_SECRET para firmar el token
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '8h' });

    // Registramos la sesión
    await UserSession.create({
      userId: user.id,
      tokenSignature: 'active', // Simplified for now, or use token substring
      ip: req.ip,
      deviceInfo: req.headers['user-agent'] || 'unknown',
      isActive: true,
      expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000) // 8 hours sync with token
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