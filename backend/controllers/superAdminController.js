const { Folio, CashCut, Tenant, User, AuditLog, DailySalesStats } = require('../models');
const { Op } = require('sequelize');

/**
 * Super Admin Controller (Hidden / Global Scope)
 * Only accessible by SUPER_ADMIN role.
 */

exports.getGlobalStats = async (req, res) => {
    try {
        // 1. Total Tenants
        const totalTenants = await Tenant.count();

        // 2. Total Users
        const totalUsers = await User.count();

        // 3. Global Sales (Sum of all DailySalesStats or CashCuts)
        // Using DailySalesStats for simpler aggregation if available, else CashCuts
        const globalSalesObj = await CashCut.sum('totalIncome', { where: { status: 'Closed' } });
        const globalSales = globalSalesObj || 0;

        // 4. Active Orders (Global)
        const activeOrders = await Folio.count({
            where: {
                status: {
                    [Op.notIn]: ['DELIVERED', 'CANCELLED']
                }
            }
        });

        res.json({
            tenants: totalTenants,
            users: totalUsers,
            globalSales,
            activeOrders
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching global stats' });
    }
};

exports.getGlobalAuditLog = async (req, res) => {
    try {
        const logs = await AuditLog.findAll({
            include: [
                { model: User, as: 'actor', attributes: ['name', 'email', 'tenantId'] }
            ],
            order: [['createdAt', 'DESC']],
            limit: 100
        });
        res.json(logs);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching audit log' });
    }
};

// Restored/Mocked SaaS Methods to prevent crash
exports.getLedger = async (req, res) => {
    try {
        // Assuming SaaSCommissionLedger exists
        const { SaaSCommissionLedger, Tenant } = require('../models');
        const ledger = await SaaSCommissionLedger.findAll({
            include: [{ model: Tenant, attributes: ['name'] }],
            order: [['createdAt', 'DESC']],
            limit: 50
        });
        res.json(ledger);
    } catch (error) {
        console.error("getLedger Error (Restored):", error);
        res.json([]); // Return empty to avoid crash
    }
};

exports.getAlerts = async (req, res) => {
    try {
        // Placeholder for alerts
        res.json({ message: "No active system alerts", alerts: [] });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching alerts' });
    }
};

exports.getTenantList = async (req, res) => {
    try {
        const tenants = await Tenant.findAll({
            include: [
                { model: User, as: 'users', limit: 1 }
            ],
            order: [['createdAt', 'DESC']]
        });

        // Fetch counts manually or in a separate pass if needed
        const { Branch } = require('../models');

        const formatted = await Promise.all(tenants.map(async t => {
            const branchCount = await Branch.count({ where: { tenantId: t.id } });
            return {
                id: t.id,
                businessName: t.businessName,
                maxBranches: t.maxBranches || 2,
                branchCount: branchCount,
                users: t.users,
                lastActive: t.updatedAt
            };
        }));

        res.json(formatted);
    } catch (error) {
        console.error("Error in getTenantList:", error);
        res.status(500).json({ message: 'Error fetching tenants', error: error.message });
    }
};

exports.updateTenantLimit = async (req, res) => {
    try {
        const { id } = req.params;
        const { maxBranches } = req.body;

        const tenant = await Tenant.findByPk(id);
        if (!tenant) return res.status(404).json({ message: "Tenant not found" });

        await tenant.update({ maxBranches: parseInt(maxBranches) });
        res.json({ message: "Limit updated", tenant });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error updating tenant" });
    }
};
