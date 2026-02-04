// Middleware to enforce strict hierarchy
// Rule: Users (non-owners) MUST be assigned to a branch to operate.
const requireBranch = (req, res, next) => {
    try {
        const { role, branchId } = req.user;

        // Owners and Super Admins bypass strict branch check
        // (They operate at Tenant Level)
        if (role === 'OWNER' || role === 'SUPER_ADMIN') {
            return next();
        }

        // Regular Users (Employees, Cashiers, Bakers) MUST have a branch
        if (!branchId) {
            return res.status(403).json({
                message: 'Acceso Denegado: Tu usuario no está asignado a ninguna sucursal. Contacta al dueño.'
            });
        }

        // Inject branchId into query if desired, but buildTenantWhere handles scope.
        // This middleware is purely for Access Control (Stop floating users).
        next();

    } catch (error) {
        console.error('RequireBranch Error:', error);
        res.status(500).json({ message: 'Error validando permisos de sucursal' });
    }
};

module.exports = requireBranch;
