// Role-based authorization middleware
// Validates user permissions based on globalRole or tenantRole

/**
 * Generic authorization function
 * @param {string[]} roles - Array of allowed roles
 * @param {string} type - 'global' or 'tenant' (default: 'global')
 */
function authorize(roles = [], type = 'global') {
  if (typeof roles === 'string') {
    roles = [roles];
  }

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'No autenticado.' });
    }

    const userRole = type === 'global' ? req.user.globalRole : req.user.tenantRole;

    if (!roles.includes(userRole)) {
      return res.status(403).json({
        message: 'No tienes permiso para realizar esta acción.',
        required: roles,
        current: userRole
      });
    }

    next();
  };
}

/**
 * Require global role (SUPER_ADMIN, ADMIN, USER)
 * @param {string[]} roles - Allowed global roles
 */
function requireGlobal(roles) {
  return authorize(roles, 'global');
}

/**
 * Require tenant role (OWNER, EMPLOYEE)
 * @param {string[]} roles - Allowed tenant roles
 */
function requireTenant(roles) {
  return authorize(roles, 'tenant');
}

// Export default as authorize for backward compatibility
module.exports = authorize;
module.exports.requireGlobal = requireGlobal;
module.exports.requireTenant = requireTenant;