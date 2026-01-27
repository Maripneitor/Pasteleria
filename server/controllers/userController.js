const User = require('../models/User');

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

exports.createUser = async (req, res) => {
  try {
    const { name, email, password, role, phone } = req.body;

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) return res.status(400).json({ message: 'El correo ya está registrado' });

    // Asumimos que el modelo User tiene un hook beforeCreate para hashear el password
    const newUser = await User.create({ name, email, password, role, phone });

    const userResp = newUser.toJSON();
    delete userResp.password;

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

    if (name) user.name = name;
    if (role) user.role = role;
    if (phone) user.phone = phone;
    if (password) user.password = password; // El hook del modelo debería hashear esto

    await user.save();
    res.json({ message: 'Usuario actualizado correctamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error actualizando usuario' });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    await User.destroy({ where: { id: req.params.id } });
    res.json({ message: 'Usuario eliminado' });
  } catch (error) {
    res.status(500).json({ message: 'Error eliminando usuario' });
  }
};