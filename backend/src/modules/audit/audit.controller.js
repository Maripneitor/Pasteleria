const AuditLog = require('../../../models/AuditLog');
const { Op } = require('sequelize');
const User = require('../../../models/user');
const asyncHandler = require('../../core/asyncHandler');

exports.getAuditLogs = asyncHandler(async (req, res) => {
    const { entity, action, limit = 50 } = req.query;
    const where = {};
    if (entity) where.entity = entity;
    if (action) where.action = action;

    const logs = await AuditLog.findAll({
        where,
        limit: Number(limit),
        order: [['createdAt', 'DESC']],
        include: [{ model: User, as: 'actor', attributes: ['name', 'email'] }]
    });

    // Expose 'meta' as 'details' for API consumers for backwards compatibility
    const result = logs.map((log) => {
        const j = log.toJSON();
        j.details = j.meta; // alias
        return j;
    });

    res.json(result);
});
