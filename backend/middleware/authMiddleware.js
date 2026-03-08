const jwt = require('jsonwebtoken');
const { User } = require('../models');
const UserSession = require('../models/UserSession');


const fs = require('fs');

module.exports = async function (req, res, next) {
  let token;
  const authHeader = req.header('Authorization');

  // 1. Intentamos obtener el token del encabezado 'Authorization'
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }
  // 2. Si no, buscamos en query params
  else if (req.query.token) {
    token = req.query.token;
  }

  // 3. Denegar si no hay token
  if (!token) {
    return res.status(401).json({ message: 'Acceso denegado. No se proporcionó un token.' });
  }

  try {
    // 4. Verificamos token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch user from DB to get the most up-to-date information, including role and name
    const user = await User.findByPk(decoded.id, {
      attributes: ['id', 'name', 'email', 'role', 'tenantId', 'branchId', 'ownerId', 'status']
    });

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    // 🛡️ EL KILL SWITCH (Bloqueo por Suspensión/Falta de Pago)
    if (user.status !== 'ACTIVE') {
      return res.status(403).json({
        message: 'ACCESO DENEGADO: Tu cuenta ha sido suspendada. Contacta a soporte o verifica tus pagos.'
      });
    }

    // 5. Guardamos usuario en req 
    req.user = {
      ...user.toJSON(), // Use user data from DB
      id: user.id, // Explicit
      role: user.role, // Rol validado directamente desde la base de datos
      tenantId: user.tenantId || null,
      branchId: user.branchId || null
    };

    // --- REFUERZO DE SEGURIDAD ---
    // Si es EMPLOYEE, debe tener branchId (regla de negocio estricta)
    if (req.user.role === 'EMPLOYEE' && !req.user.branchId) {
      return res.status(403).json({ message: 'Acceso Denegado: Empleado sin sucursal asignada.' });
    }

    // --- Heartbeat: Update session lastSeenAt ---
    // Intenta actualizar sesión, pero no bloquea si falla (fire & forget)
    // Solo si el token tiene firma (evita overhead en tokens muy cortos de prueba)
    if (token.length > 20) {
      const tokenSignature = token.slice(-20);
      UserSession.update(
        { lastSeenAt: new Date() },
        { where: { userId: decoded.id, tokenSignature, isActive: true } }
      ).catch(err => {
        // Silently ignore session update errors to avoid blocking requests
        // console.error('Session heartbeat error:', err.message);
      });
    }

    // 6. Next
    next();
  } catch (error) {
    console.error('Auth Middleware Error:', error.message);
    // Explicit 401 for bad tokens
    return res.status(401).json({ message: 'Token no válido o expirado.' });
  }
};