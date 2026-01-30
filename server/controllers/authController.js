const { User, sequelize } = require('../models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Función para REGISTRAR un nuevo usuario
exports.register = async (req, res) => {
  try {
    const { username, email, password, globalRole } = req.body;

    // Encriptamos la contraseña antes de guardarla
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      username,
      email,
      password: hashedPassword, // Guardamos la contraseña encriptada
      globalRole: globalRole
    });

    // Excluimos la contraseña de la respuesta por seguridad
    const userResponse = newUser.toJSON();
    delete userResponse.password;

    res.status(201).json({ message: "Usuario registrado exitosamente", user: userResponse });
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

    // 3. Si todo es correcto, crear un Token (JWT)
    const payload = {
      id: user.id,
      username: user.username,
      role: user.globalRole,
      tenantId: user.tenantId
    };

    // Se utiliza la variable de entorno JWT_SECRET para firmar el token
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '8h' });

    res.status(200).json({
      message: "Inicio de sesión exitoso",
      token: token,
      user: {
        id: user.id,
        username: user.username,
        role: user.globalRole
      }
    });

  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
};