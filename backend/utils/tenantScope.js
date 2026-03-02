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

    const role = user.role;

    // SUPER_ADMIN y ADMIN (General) ven todo
    if (role === 'SUPER_ADMIN' || role === 'ADMIN') {
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

/**
 * Builds a WHERE object to filter by branch based on user hierarchy.
 * - SUPER_ADMIN: sees all, can filter by ?branchId=...
 * - OWNER: sees all his branches, can filter by ?branchId=...
 * - EMPLOYEE: strictly limited to his assigned branchId.
 */
function buildBranchWhere(req, { branchField = 'branchId' } = {}) {
    const user = req.user;
    if (!user) return {};

    const role = user.role;

    // 1. Strict limit for employees
    if (role === 'EMPLOYEE') {
        const branchId = user.branchId || null;
        return { [branchField]: branchId };
    }

    // 2. Global/Owner can filter via query
    if (req.query?.branchId) {
        return { [branchField]: Number(req.query.branchId) };
    }

    // 3. Defaults for Owner: depends if we want to force his house matrix or see all. 
    // Usually, if no filter, they see everything from their tenant.
    return {};
}

module.exports = { buildTenantWhere, buildBranchWhere };
