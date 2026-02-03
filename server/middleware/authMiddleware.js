const jwt = require('jsonwebtoken');
const UserSession = require('../models/UserSession');

// Helper to determine Effective Role based on DB Role + Context
function normalizeRole(globalRole, ownerId) {
  const r = String(globalRole || '').trim();
  const upper = r.toUpperCase();

  // 1. High Priv roles are direct
  if (['ADMIN', 'ADMINISTRADOR', 'ADMINISTRATOR'].includes(upper)) return 'ADMIN';
  if (upper === 'SUPER_ADMIN') return 'SUPER_ADMIN';

  // 2. USER Separation using ownerId
  if (['USER', 'USUARIO'].includes(upper)) {
    // If has ownerId, they are an EMPLOYEE
    if (ownerId) return 'EMPLOYEE';
    // If no ownerId, they are likely the Business OWNER
    return 'OWNER';
  }

  // 3. Fallbacks (Legacy or Explicit String)
  if (['OWNER'].includes(upper) || r === 'owner') return 'OWNER';
  if (['EMPLOYEE'].includes(upper) || r === 'employee') return 'EMPLOYEE';

  return 'USER'; // Default fallback
}

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

    // 5. Guardamos usuario en req CON ROL NORMALIZADO
    req.user = {
      ...decoded,
      id: decoded.id, // Explicit
      role: normalizeRole(decoded.globalRole || decoded.role, decoded.ownerId), // Normalize with context
      tenantId: decoded.tenantId || null
    };

    // --- Heartbeat: Update session lastSeenAt ---
    const tokenSignature = token.length > 20 ? token.slice(-20) : token;

    try {
      await UserSession.update(
        { lastSeenAt: new Date() },
        { where: { userId: decoded.id, tokenSignature, isActive: true } }
      );
    } catch (sessionErr) {
      console.error('Session heartbeat error:', sessionErr);
    }

    // 6. Next
    next();
  } catch (error) {
    console.error('Auth Middleware Error:', error.message);
    res.status(401).json({ message: 'Token no válido.' });
  }
};