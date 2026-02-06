const { SaaSCommissionLedger, AuditLog, Tenant } = require('../models');
const { Op } = require('sequelize');

exports.getLedger = async (req, res) => {
    try {
        const { from, to, tenantId } = req.query;
        const where = {};

        if (from && to) {
            where.createdAt = { [Op.between]: [from, to] };
        }
        if (tenantId) where.tenantId = tenantId;

        const ledger = await SaaSCommissionLedger.findAll({
            where,
            include: [{ model: Tenant, attributes: ['businessName'] }],
            order: [['createdAt', 'DESC']]
        });

        res.json(ledger);
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Error fetching ledger' });
    }
};

exports.getAlerts = async (req, res) => {
    try {
        const { from, to } = req.query;
        const where = {
            entity: 'SAAS_ALERT'
        };

        if (from && to) {
            where.createdAt = { [Op.between]: [from, to] };
        }

        const alerts = await AuditLog.findAll({
            where,
            order: [['createdAt', 'DESC']]
        });

        res.json(alerts);
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Error fetching alerts' });
    }
};
