const { User } = require('../../../models');
const auditService = require('../../../services/auditService'); // Temp
const { buildTenantWhere } = require('../../../utils/tenantScope');
const asyncHandler = require('../../core/asyncHandler');

exports.getAllUsers = asyncHandler(async (req, res) => {
  const where = buildTenantWhere(req);
  const users = await User.findAll({
    where,
    attributes: { exclude: ['password'] }
  });
  res.json(users);
});

exports.getPendingUsers = asyncHandler(async (req, res) => {
  const baseWhere = buildTenantWhere(req);
  const where = { ...baseWhere, status: 'PENDING' };
  const users = await User.findAll({
    where,
    attributes: { exclude: ['password'] }
  });
  res.json(users);
});

exports.createUser = asyncHandler(async (req, res) => {
  const { username, email, password, role, isActive } = req.body;
  const globalRole = role || 'USER';

  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) {
    const err = new Error('El correo ya está registrado');
    err.status = 400;
    throw err;
  }

  const newUser = await User.create({
    username, // Map from body
    email,
    password,
    globalRole,
    isActive: isActive !== undefined ? isActive : true
  });

  const userResp = newUser.toJSON();
  delete userResp.password;

  auditService.log('CREATE', 'USER', newUser.id, { username: newUser.username }, req.user?.id);
  res.status(201).json(userResp);
});

exports.updateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, role, password, phone } = req.body;

  const user = await User.findByPk(id);
  if (!user) {
    const err = new Error('Usuario no encontrado');
    err.status = 404;
    throw err;
  }

  if (name) user.username = name;
  if (role) user.globalRole = role;
  if (phone) user.phone = phone;
  if (password) user.password = password;
  if (req.body.isActive !== undefined) user.isActive = req.body.isActive;

  await user.save();
  auditService.log('UPDATE', 'USER', user.id, { changes: req.body }, req.user?.id);
  res.json({ message: 'Usuario actualizado correctamente' });
});

exports.deleteUser = asyncHandler(async (req, res) => {
  const userId = req.params.id;
  await User.destroy({ where: { id: userId } });
  auditService.log('DELETE', 'USER', userId, {}, req.user?.id);
  res.json({ message: 'Usuario eliminado' });
});