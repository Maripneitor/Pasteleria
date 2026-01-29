const { User } = require('../models');
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
    console.log("📨 Recibida petición de login:", req.body);
    const { email, password } = req.body;

    // 1. Buscar al usuario por su email
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    // 2. Comparar la contraseña enviada con la encriptada en la BD
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Contraseña incorrecta.' });
    }

    // 3. Si todo es correcto, crear un Token (JWT)
    const payload = {
      id: user.id,
      username: user.username,
      role: user.globalRole
    };

    console.log("✅ Login Exitoso para:", email);

    // --- CORRECCIÓN APLICADA ---
    // Se utiliza la variable de entorno JWT_SECRET para firmar el token,
    // en lugar de tener la clave secreta directamente en el código.
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '8h' });

    res.status(200).json({
      message: "Inicio de sesión exitoso",
      token: token
    });

  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
};