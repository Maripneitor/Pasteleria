const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const AuditLog = sequelize.define('AuditLog', {
    tenantId: { type: DataTypes.INTEGER, allowNull: true },
    entity: { type: DataTypes.STRING(30), allowNull: false }, // 'FOLIO'
    entityId: { type: DataTypes.BIGINT, allowNull: false },
    action: { type: DataTypes.STRING(30), allowNull: false }, // CREATE/UPDATE/CANCEL/DELETE
    actorUserId: { type: DataTypes.BIGINT, allowNull: true },
    meta: { type: DataTypes.JSON, allowNull: true, defaultValue: {} },
}, { tableName: 'audit_logs' });

module.exports = AuditLog;
