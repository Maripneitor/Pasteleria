const { Op } = require('sequelize');

/**
 * Builds a WHERE object for Sequelize to filter by tenant.
 * - If user is SUPER_ADMIN: returns empty object (sees all) OR allows optional query filtering
 * - If user is ADMIN/USER: returns { tenantId: req.user.tenantId }
 * 
 * @param {Object} req - Express request object (must have req.user from authMiddleware)
 * @param {Object} options
 * @param {string} options.tenantField - database column name, default 'tenantId'
 * @param {boolean} options.allowQueryTenant - if true, SUPER_ADMIN can filter by ?tenantId=...
 * @returns {Object} Sequelize where clause partial
 */
function buildTenantWhere(req, { tenantField = 'tenantId', allowQueryTenant = true } = {}) {
    const user = req.user;

    // Safety check: if no user logic (e.g. public endpoint), decide default safety. 
    // For safety, if we expect auth but it's missing, return restrictive or empty depending on flow.
    // Assuming authMiddleware ran, req.user exists.
    if (!user) {
        return {};
    }

    const role = user.globalRole;

    // SUPER_ADMIN ve todo
    if (role === 'SUPER_ADMIN') {
        // Si queremos permitir que filtre explícitamente en la URL ?tenantId=2
        if (allowQueryTenant && req.query?.tenantId) {
            return { [tenantField]: Number(req.query.tenantId) };
        }
        // Si no, ve todo
        return {};
    }

    // ADMIN / USER: siempre cerco lógico
    // Nota: req.user.tenantId viene del token/authMiddleware
    const tenantId = user.tenantId || 1;
    return { [tenantField]: tenantId };
}

module.exports = { buildTenantWhere };
