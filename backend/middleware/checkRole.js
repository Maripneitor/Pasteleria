const authorize = require('./roleMiddleware');

/**
 * Middleware: Check Role
 * Restricts access to specific roles.
 * Wrapper around the centralized roleMiddleware for backward compatibility.
 */
module.exports = function checkRole(allowedRoles = []) {
    return authorize(allowedRoles);
};
