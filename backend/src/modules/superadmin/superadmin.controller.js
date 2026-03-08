const { Folio, CashCut, Tenant, User, AuditLog, DailySalesStats, Branch, SaaSCommissionLedger } = require('../../../models');
const { Op } = require('sequelize');
const asyncHandler = require('../../core/asyncHandler');

/**
 * Super Admin Controller (Hidden / Global Scope)
 * Only accessible by SUPER_ADMIN role.
 */

exports.getGlobalStats = asyncHandler(async (req, res) => {
    // 1. Total Tenants
    const totalTenants = await Tenant.count();

    // 2. Total Users
    const totalUsers = await User.count();

    // 3. Global Sales (Sum of all DailySalesStats or CashCuts)
    const globalSalesObj = await CashCut.sum('totalIncome', { where: { status: 'Closed' } });
    const globalSales = globalSalesObj || 0;

    // 4. Active Orders (Global)
    const activeOrders = await Folio.count({
        where: {
            estatus_folio: {
                [Op.notIn]: ['Entregado', 'Cancelado'] // Adjusting to Spanish if needed by consistency, but keeping logic
            }
        }
    });

    res.json({
        tenants: totalTenants,
        users: totalUsers,
        globalSales,
        activeOrders
    });
});

exports.getGlobalAuditLog = asyncHandler(async (req, res) => {
    const logs = await AuditLog.findAll({
        include: [
            { model: User, as: 'actor', attributes: ['username', 'email', 'tenantId'] }
        ],
        order: [['createdAt', 'DESC']],
        limit: 100
    });
    res.json(logs);
});

exports.getLedger = asyncHandler(async (req, res) => {
    if (!SaaSCommissionLedger) return res.json([]);

    const ledger = await SaaSCommissionLedger.findAll({
        include: [{ model: Tenant, attributes: ['businessName'] }],
        order: [['createdAt', 'DESC']],
        limit: 50
    });
    res.json(ledger);
});

exports.getAlerts = asyncHandler(async (req, res) => {
    res.json({ message: "No active system alerts", alerts: [] });
});

exports.getTenantList = asyncHandler(async (req, res) => {
    const tenants = await Tenant.findAll({
        include: [
            { model: User, as: 'users', limit: 1 },
            { model: Branch, as: 'branches' }
        ],
        order: [['createdAt', 'DESC']]
    });

    const formatted = tenants.map(t => ({
        id: t.id,
        businessName: t.businessName,
        maxBranches: t.maxBranches || 2,
        branchCount: t.branches ? t.branches.length : 0,
        users: t.users,
        lastActive: t.updatedAt
    }));

    res.json(formatted);
});

exports.updateTenantLimit = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { maxBranches } = req.body;

    const tenant = await Tenant.findByPk(id);
    if (!tenant) return res.status(404).json({ message: "Tenant not found" });

    await tenant.update({ maxBranches: parseInt(maxBranches) });
    res.json({ message: "Limit updated", tenant });
});
