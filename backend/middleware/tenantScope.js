/**
 * Middleware para filtrar datos por Tenant (Multi-tenancy)
 * basado en el rol del usuario.
 * 
 * Admin: Ve todo (scope vacío)
 * Owner/Employee: Ve solo su tenantId
 */
const { Tenant, Branch } = require('../models');

const fs = require('fs');

const tenantScope = async (req, res, next) => {
    try {
        // fs.appendFileSync('trace.log', `[${req.method} ${req.originalUrl}] Entered tenantScope middleware\n`);
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
        const isGlobalAdmin = user.role === 'SUPER_ADMIN' || user.role === 'ADMIN';

        if (isGlobalAdmin) {
            // SuperAdmin or General Admin can optionally filter by specific tenant via query/body
            // If no tenant specified, they see everything (empty filter)
            const targetTenantId = req.query.tenantId || req.body.tenantId;
            if (targetTenantId) {
                req.tenantFilter = { tenantId: targetTenantId };
                req.isGlobalAdmin = false; // Acting as specific tenant
            } else {
                req.tenantFilter = {};
                req.isGlobalAdmin = true;
            }
        } else {
            // Force strict caching & isolation
            if (!user.tenantId) {
                // Fallback for edge case users without tenant (should not happen in prod)
                return res.status(403).json({ message: 'Usuario sin organización asignada.' });
            }
            req.tenantFilter = { tenantId: user.tenantId };
            req.isGlobalAdmin = false;
        }

        next();
    } catch (e) {
        console.error("TenantScope Error:", e);
        res.status(500).json({ message: "Error de seguridad (Scope)" });
    }
};

module.exports = tenantScope;
