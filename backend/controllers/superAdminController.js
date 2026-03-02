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

// SaaS Contract Management
exports.getContract = async (req, res) => {
    try {
        const { tenantId } = req.params;
        const contract = await SaaSContract.findOne({ where: { tenantId } });
        if (!contract) return res.status(404).json({ message: "No se encontró un contrato para este Tenant." });
        res.json(contract);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error obteniendo contrato' });
    }
};

exports.updateContract = async (req, res) => {
    try {
        const { tenantId } = req.params;
        const { commissionType, rateValue, billingCycle, isActive } = req.body;

        const [contract, created] = await SaaSContract.findOrCreate({
            where: { tenantId },
            defaults: { tenantId, commissionType, rateValue, billingCycle, isActive }
        });

        if (!created) {
            await contract.update({
                commissionType: commissionType !== undefined ? commissionType : contract.commissionType,
                rateValue: rateValue !== undefined ? rateValue : contract.rateValue,
                billingCycle: billingCycle !== undefined ? billingCycle : contract.billingCycle,
                isActive: isActive !== undefined ? isActive : contract.isActive
            });
        }

        // AUDIT
        const auditService = require('../services/auditService');
        auditService.log('UPDATE_CONTRACT', 'SAAS_CONTRACT', contract.id, { changes: req.body, tenantId }, req.user.id);

        res.json({ message: created ? "Contrato creado" : "Contrato actualizado", contract });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error actualizando contrato' });
    }
};

// Restored/Mocked SaaS Methods to prevent crash
exports.getLedger = async (req, res) => {
    try {
        const { SaaSCommissionLedger, Tenant } = require('../models');
        const ledger = await SaaSCommissionLedger.findAll({
            include: [{ model: Tenant, as: 'tenant', attributes: ['name'] }],
            order: [['createdAt', 'DESC']],
            limit: 100
        });
        res.json(ledger);
    } catch (error) {
        console.error("getLedger Error:", error);
        res.json([]);
    }
};

exports.getAlerts = async (req, res) => {
    try {
        const alerts = await AuditLog.findAll({
            where: { entity: 'SAAS_ALERT' },
            include: [
                { model: User, as: 'actor', attributes: ['name', 'email'] },
                { model: Tenant, as: 'tenant', attributes: ['businessName'] }
            ],
            order: [['createdAt', 'DESC']],
            limit: 50
        });
        res.json({ message: alerts.length ? "Active system alerts found" : "No active system alerts", alerts });
    } catch (error) {
        console.error(error);
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
        const { id: tenantId } = req.params;
        const { maxBranches, maxUsers } = req.body;

        const tenant = await Tenant.findByPk(tenantId);
        if (!tenant) return res.status(404).json({ message: "Tenant not found" });

        // Update Tenant limits if provided
        if (maxBranches !== undefined) {
            await tenant.update({ maxBranches: parseInt(maxBranches) });
        }

        // Update Owner limits if provided
        if (maxUsers !== undefined) {
            const owner = await User.findOne({ where: { tenantId, role: 'OWNER' } });
            if (owner) {
                await owner.update({ maxUsers: parseInt(maxUsers) });

                // AUDIT
                const auditService = require('../services/auditService');
                auditService.log('UPDATE_LIMIT', 'USER', owner.id, { maxUsers, tenantId }, req.user?.id);
            }
        }

        res.json({ message: "Límites actualizados correctamente", tenantId, payload: req.body });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error actualizando límites del tenant" });
    }
};

exports.getGlobalSessions = async (req, res) => {
    try {
        const { UserSession, User } = require('../models');
        const sessions = await UserSession.findAll({
            include: [{ model: User, as: 'user', attributes: ['name', 'email', 'tenantId'] }],
            order: [['lastSeenAt', 'DESC']],
            limit: 100
        });
        res.json(sessions);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching sessions' });
    }
};

exports.getGlobalActivationCodes = async (req, res) => {
    try {
        const { ActivationCode, User, Branch } = require('../models');
        const codes = await ActivationCode.findAll({
            include: [
                { model: User, as: 'owner', attributes: ['name', 'email'] },
                { model: Branch, as: 'branch', attributes: ['name'] }
            ],
            order: [['createdAt', 'DESC']]
        });
        res.json(codes);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching activation codes' });
    }
};
