/**
 * Middleware para filtrar datos por Tenant (Multi-tenancy)
 * basado en el rol del usuario.
 * 
 * Admin: Ve todo (scope vacío)
 * Owner/Employee: Ve solo su tenantId
 */
const { Tenant, Branch } = require('../models');

const tenantScope = async (req, res, next) => {
    try {
        const user = req.user;

        if (!user) {
            return res.status(401).json({ message: 'Auth requerido para scope' });
        }

        // INJECTION: Load models
        if (user.tenantId) {
            req.tenant = await Tenant.findByPk(user.tenantId);
        }
        if (user.branchId) {
            req.branch = await Branch.findByPk(user.branchId);
        }

        // SCALING: Logic for scope
        if (user.role === 'SUPER_ADMIN') {
            req.tenantFilter = {};
            req.isGlobalAdmin = true;
        } else {
            // Force strict caching
            const tenantId = user.tenantId || 1;
            req.tenantFilter = { tenantId: tenantId };
            req.isGlobalAdmin = false;
        }

        next();
    } catch (e) {
        console.error("TenantScope Error:", e);
        res.status(500).json({ message: "Error de seguridad (Scope)" });
    }
};

module.exports = tenantScope;
