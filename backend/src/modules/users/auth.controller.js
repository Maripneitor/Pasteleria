const authService = require('./auth.service');
const asyncHandler = require('../../core/asyncHandler');

exports.register = asyncHandler(async (req, res) => {
  const user = await authService.register(req.body);
  res.status(201).json({ message: "Registro exitoso. Tu cuenta está pendiente de activación.", user });
});

exports.login = asyncHandler(async (req, res) => {
  const requestId = req.requestId || 'unknown';
  const { email, username, password } = req.body;

  if (!password || (!email && !username)) {
    const err = new Error('Credenciales incompletas.');
    err.status = 400;
    err.code = 'INVALID_INPUT';
    throw err;
  }

  const result = await authService.login({
    email,
    username,
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