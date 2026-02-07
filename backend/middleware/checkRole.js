/**
 * Middleware: Check Role
 * Restricts access to specific roles.
 * Usage: router.get('/admin', checkRole(['ADMIN', 'SUPER_ADMIN']), controller.action);
 */
module.exports = function checkRole(allowedRoles = []) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'No autenticado.' });
        }

        const userRole = req.user.role;

        // Ensure allowedRoles is array
        const rolesObj = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

        if (!rolesObj.includes(userRole)) {
            return res.status(403).json({
                message: 'Acceso Prohibido: No tienes permisos suficientes para esta acción.'
            });
        }

        next();
    };
};
