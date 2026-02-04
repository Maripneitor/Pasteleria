const authService = require('../services/authService');

exports.register = async (req, res) => {
  try {
    const user = await authService.register(req.body);
    res.status(201).json({ message: "Registro exitoso. Tu cuenta está pendiente de activación.", user });
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ message: 'El email ya está registrado.' });
    }
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
};

exports.login = async (req, res) => {
  const requestId = req.requestId || 'unknown';
  try {
    const { email, username, password } = req.body;

    // Basic validation
    if (!password || (!email && !username)) {
      return res.status(400).json({
        ok: false,
        code: 'INVALID_INPUT',
        message: 'Credenciales incompletas.',
        requestId
      });
    }

    const result = await authService.login({
      email,
      username,
      password,
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.status(200).json(result);

  } catch (error) {
    console.error(`❌ [Login Error] RequestID: ${requestId}`, error);

    // Handled Service Errors
    if (error.status) {
      return res.status(error.status).json({
        ok: false,
        code: error.code || 'ERROR',
        message: error.message,
        ...error.data,
        requestId
      });
    }

    // Database Errors
    if (error.name === 'SequelizeDatabaseError' || error.name === 'SequelizeConnectionError') {
      return res.status(503).json({
        ok: false,
        code: 'DATABASE_ERROR',
        message: 'Servicio temporalmente no disponible.',
        requestId
      });
    }

    // Generic Error
    res.status(500).json({
      ok: false,
      code: 'INTERNAL_ERROR',
      message: 'Error interno del servidor.',
      requestId
    });
  }
};

exports.logout = async (req, res) => {
  try {
    const token = req.header('Authorization')?.split(' ')[1];
    if (req.user) {
      await authService.logout(token, req.user.id);
    }
    res.status(200).json({ message: 'Sesión cerrada correctamente.' });
  } catch (error) {
    console.error('Logout Error:', error);
    res.status(500).json({ message: 'Error al cerrar sesión' });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await authService.getMe(req.user.id);
    res.json(user);
  } catch (error) {
    console.error(error);
    const status = error.status || 500;
    res.status(status).json({ message: error.message || "Error al obtener perfil" });
  }
};