/**
 * authorize
 * Generic authorization middleware that leverages the hierarchical methods of the User instance.
 * @param {string|string[]} roles - Array of allowed roles or single role
 * @param {string} type - 'global' or 'tenant' (contextual metadata)
 */
function authorize(roles = [], type = 'global') {
  const allowed = Array.isArray(roles) ? roles : [roles];

  return (req, res, next) => {
    const user = req.user;

    if (!user) {
      return res.status(401).json({ message: 'No autenticado.' });
    }

    // Bypass SUPER_ADMIN
    if (user.role === 'SUPER_ADMIN') {
      return next();
    }

    // Validar usando jerarquía acumulativa si es posible
    if (allowed.includes('ADMIN') && user.isAdmin && user.isAdmin()) {
      return next();
    }

    if (allowed.includes('OWNER') && user.isOwner && user.isOwner()) {
      return next();
    }

    // Validación estándar por inclusión exacta de rol
    if (allowed.includes(user.role)) {
      return next();
    }

    // Forbidden
    return res.status(403).json({
      message: 'No tienes permiso para realizar esta acción.',
      required: allowed,
      current: user.role
    });
  };
}

/**
 * Require global role (SUPER_ADMIN, ADMIN, USER)
 */
function requireGlobal(roles) {
  return authorize(roles, 'global');
}

/**
 * Require tenant role (OWNER, EMPLOYEE)
 */
function requireTenant(roles) {
  return authorize(roles, 'tenant');
}

module.exports = authorize;
module.exports.requireGlobal = requireGlobal;
module.exports.requireTenant = requireTenant;
