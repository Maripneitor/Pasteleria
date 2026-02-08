const fs = require('fs');

// Middleware to enforce strict hierarchy
// Rule: Users (non-owners) MUST be assigned to a branch to operate.
const requireBranch = (req, res, next) => {
    try {
        // fs.appendFileSync('trace.log', `[${req.method} ${req.originalUrl}] Entered requireBranch middleware\n`);
        const { role, branchId } = req.user;

        // Owners and Super Admins bypass strict branch check
        // (They operate at Tenant Level)
        if (role === 'OWNER' || role === 'SUPER_ADMIN' || role === 'ADMIN') {
            return next();
        }

        // Regular Users (Employees, Cashiers, Bakers) MUST have a branch
        if (!branchId) {
            return res.status(403).json({
                message: 'Acceso Denegado: Tu usuario no está asignado a ninguna sucursal. Contacta al dueño.'
            });
        }

        // STRICT CHECK: If request tries to modify/access another branch ID explicitly
        const targetBranchId = req.params.branchId || req.body.branchId || req.query.branchId;
        if (targetBranchId && String(targetBranchId) !== String(branchId)) {
            return res.status(403).json({
                message: 'Acceso Denegado: No puedes operar en una sucursal distinta a la asignada.'
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
