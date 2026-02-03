const User = require('../models/user');
const auditService = require('../services/auditService');

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password'] }
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener usuarios' });
  }
};

exports.getPendingUsers = async (req, res) => {
  try {
    const { role, tenantId } = req.user;
    const where = { status: 'PENDING' };

    // If Owner, maybe specific logic?
    // But for now, if user registered with a tenantId, we filter by it.
    // If user registered with null tenantId, only Admin sees them?
    // Or if Owner wants to "adopt" a user, maybe they don't need to see them in a list first?
    // The code generation is the key customization.
    // Let's implement strict tenant filtering if tenantId is present on the user.

    if (role === 'owner' || role === 'employee') {
      // Employees shouldn't see this list usually, but if they did...
      if (tenantId) where.tenantId = tenantId;
    }

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
    const { username, email, password, role, isActive } = req.body;
    const globalRole = role || 'USER'; // Map role to globalRole

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) return res.status(400).json({ message: 'El correo ya está registrado' });

    // Asumimos que el modelo User tiene un hook beforeCreate para hashear el password
    const newUser = await User.create({ username, email, password, globalRole, isActive: isActive !== undefined ? isActive : true });

    const userResp = newUser.toJSON();
    delete userResp.password;

    // AUDIT
    auditService.log('CREATE', 'USER', newUser.id, { username: newUser.username }, req.user?.id);

    res.status(201).json(userResp);
  } catch (error) {
    res.status(500).json({ message: 'Error creando usuario', error: error.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, role, password, phone } = req.body;

    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

    if (name) user.username = name; // Map name to username
    if (role) user.globalRole = role;
    if (phone) user.phone = phone; // Note: phone not in model yet, but leaving for now if added later
    if (password) user.password = password;
    if (req.body.isActive !== undefined) user.isActive = req.body.isActive;

    await user.save();

    // AUDIT
    auditService.log('UPDATE', 'USER', user.id, { changes: req.body }, req.user?.id);

    res.json({ message: 'Usuario actualizado correctamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error actualizando usuario' });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;
    await User.destroy({ where: { id: userId } });

    // AUDIT
    auditService.log('DELETE', 'USER', userId, {}, req.user?.id);

    res.json({ message: 'Usuario eliminado' });
  } catch (error) {
    res.status(500).json({ message: 'Error eliminando usuario' });
  }
};