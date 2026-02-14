const User = require('../models/user');
const auditService = require('../services/auditService');
const { buildTenantWhere } = require('../utils/tenantScope');

exports.getAllUsers = async (req, res) => {
  try {
    const where = buildTenantWhere(req);
    const users = await User.findAll({
      where,
      attributes: { exclude: ['password'] }
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener usuarios' });
  }
};

exports.getPendingUsers = async (req, res) => {
  try {
    const baseWhere = buildTenantWhere(req);
    // Combine with status PENDING
    const where = { ...baseWhere, status: 'PENDING' };

    const users = await User.findAll({
      where,
      attributes: { exclude: ['password'] }
    });
    res.json(users);
  } catch (e) {
    res.status(500).json({ message: 'Error obteniendo usuarios pendientes' });
  }
};

exports.createUser = async (req, res) => {
  try {
    const { username, name, email, password, role, isActive, branchId } = req.body;

    // Default to req.user.tenantId unless SUPER_ADMIN or ADMIN provides one
    const isGlobalAdmin = req.user.role === 'SUPER_ADMIN' || req.user.role === 'ADMIN';
    const tenantId = isGlobalAdmin ? (req.body.tenantId || req.user.tenantId) : req.user.tenantId;

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) return res.status(400).json({ message: 'El correo ya está registrado' });

    const newUser = await User.create({
      name: name || username,
      email,
      password,
      role: role || 'EMPLOYEE',
      isActive: isActive !== undefined ? isActive : true,
      tenantId,
      branchId
    });

    const userResp = newUser.toJSON();
    delete userResp.password;

    // AUDIT
    auditService.log('CREATE', 'USER', newUser.id, { email: newUser.email, role: newUser.role }, req.user?.id);

    res.status(201).json(userResp);
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ message: 'Error creando usuario', error: error.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, role, password, status, isActive, branchId } = req.body;

    const isGlobalAdmin = req.user.role === 'SUPER_ADMIN' || req.user.role === 'ADMIN';
    const where = { id };
    if (!isGlobalAdmin) {
      where.tenantId = req.user.tenantId;
    }

    const user = await User.findOne({ where });
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado o sin acceso' });

    if (name) user.name = name;
    if (role) user.role = role;
    if (password) user.password = password; // Should be hashed by hook
    if (status) user.status = status;
    if (isActive !== undefined) user.isActive = isActive;
    if (branchId !== undefined) user.branchId = branchId;
    if (isGlobalAdmin && req.body.tenantId) user.tenantId = req.body.tenantId;

    await user.save();

    // AUDIT
    auditService.log('UPDATE', 'USER', user.id, { changes: req.body }, req.user?.id);

    res.json({ message: 'Usuario actualizado correctamente' });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ message: 'Error actualizando usuario' });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const where = { id };
    if (req.user.role !== 'SUPER_ADMIN') {
      where.tenantId = req.user.tenantId;
    }

    const deleted = await User.destroy({ where });

    if (!deleted) {
      return res.status(444).json({ message: 'Usuario no encontrado o sin acceso' });
    }

    // AUDIT
    auditService.log('DELETE', 'USER', id, {}, req.user?.id);

    res.json({ message: 'Usuario eliminado' });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ message: 'Error eliminando usuario' });
  }
};