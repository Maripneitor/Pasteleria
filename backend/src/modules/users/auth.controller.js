const authService = require('./auth.service');
const asyncHandler = require('../../core/asyncHandler');

exports.register = asyncHandler(async (req, res) => {
  // Extraemos las variables, soportando tanto 'username' como 'name'
  const { username, name, email, password, role, tenantId } = req.body;
  
  // Forzamos la creación de la variable 'name' para que el servicio y la BD estén felices
  const finalName = name || username || 'Usuario Nuevo';

  // Le enviamos la estructura exacta que espera auth.service.js
  const user = await authService.register({
      name: finalName,
      email,
      password,
      role,
      tenantId
  });

  res.status(201).json({ message: "Registro exitoso. Tu cuenta está pendiente de activación.", user });
});

exports.login = asyncHandler(async (req, res) => {
  const requestId = req.requestId || 'unknown';
  const { email, username, name, password } = req.body;

  if (!password || (!email && !username && !name)) {
    const err = new Error('Credenciales incompletas.');
    err.status = 400;
    err.code = 'INVALID_INPUT';
    throw err;
  }

  // Si el frontend envía 'username', lo renombramos a 'finalName'
  const finalName = name || username;

  const result = await authService.login({
    email,
    name: finalName, // <--- Aquí estaba el error, ahora pasamos correctamente 'name'
    password,
    ip: req.ip,
    userAgent: req.headers['user-agent']
  });

  res.status(200).json(result);
});

exports.logout = asyncHandler(async (req, res) => {
  const token = req.header('Authorization')?.split(' ')[1];
  if (req.user) {
    await authService.logout(token, req.user.id);
  }
  res.status(200).json({ message: 'Sesión cerrada correctamente.' });
});

exports.getMe = asyncHandler(async (req, res) => {
  const user = await authService.getMe(req.user.id);
  res.json(user);
});