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
  // 1. Extraemos los datos del body (puedes recibir 'username' o 'name' desde el front)
  const { username, name, email, password, role, status } = req.body;
  
  // 2. Mapeamos: El modelo espera 'name' y 'role'
  const nameToSave = name || username; 
  const roleToSave = role || 'EMPLOYEE'; // 'EMPLOYEE' es el default en tu modelo

  // Medida de seguridad: Solo SUPER_ADMIN puede dar roles de ADMIN o SUPER_ADMIN
  if (['ADMIN', 'SUPER_ADMIN'].includes(roleToSave)) {
    if (req.user?.role !== 'SUPER_ADMIN') {
      const err = new Error('Error de Seguridad: Solo el dueño/SuperAdmin original puede conceder permisos de ADMIN o SUPER_ADMIN.');
      err.status = 403;
      throw err;
    }
  }

  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) {
    const err = new Error('El correo ya está registrado');
    err.status = 400;
    throw err;
  }

  // 3. Creamos el usuario con los nombres de columna correctos
  const newUser = await User.create({
    name: nameToSave,      // <--- Corregido: antes era 'username'
    email,
    password,              // Sequelize se encargará del hash si tienes el hook, si no, asegúrate de hashearlo antes
    role: roleToSave,      // <--- Corregido: antes era 'globalRole'
    status: status || 'ACTIVE' // <--- Corregido: tu modelo usa 'status', no 'isActive'
  });

  const userResp = newUser.toJSON();
  delete userResp.password;

  auditService.log('CREATE', 'USER', newUser.id, { name: newUser.name }, req.user?.id);
  res.status(201).json(userResp);
});

exports.updateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, username, role, password, phone, status } = req.body;

  const user = await User.findByPk(id);
  if (!user) {
    const err = new Error('Usuario no encontrado');
    err.status = 404;
    throw err;
  }

  // Medida de Seguridad
  if (role && ['ADMIN', 'SUPER_ADMIN'].includes(role)) {
    if (req.user?.role !== 'SUPER_ADMIN') {
      const err = new Error('Error de Seguridad: Solo el dueño/SuperAdmin original puede conceder permisos de ADMIN o SUPER_ADMIN.');
      err.status = 403;
      throw err;
    }
  }

  // Mapeo de actualización
  if (name || username) user.name = name || username; // <--- Sincronizado con el modelo
  if (role) user.role = role;                         // <--- Sincronizado con el modelo
  if (phone) user.phone = phone; 
  if (password) user.password = password;
  if (status) user.status = status;                   // <--- Usando el ENUM de tu modelo

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