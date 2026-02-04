const AuditLog = require('../models/AuditLog');
const { Op } = require('sequelize');
const User = require('../models/user');

exports.getAuditLogs = async (req, res) => {
    try {
        const { entity, action, limit = 50 } = req.query;
        const where = {};
        if (entity) where.entity = entity;
        if (action) where.action = action;

        const logs = await AuditLog.findAll({
            where,
            limit: Number(limit),
            order: [['createdAt', 'DESC']],
            include: [{ model: User, as: 'actor', attributes: ['username', 'email'] }]
        });

        res.json(logs);
    } catch (e) {
        console.error("Audit fetch error:", e);
        res.status(500).json({ message: 'Error fetching logs' });
    }
};
