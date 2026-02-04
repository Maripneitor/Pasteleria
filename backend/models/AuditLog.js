const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const AuditLog = sequelize.define('AuditLog', {
    tenantId: { type: DataTypes.BIGINT, allowNull: true },
    entity: { type: DataTypes.STRING(30), allowNull: true }, // 'FOLIO'
    entityId: { type: DataTypes.BIGINT, allowNull: true },
    action: { type: DataTypes.STRING(30), allowNull: true }, // CREATE/UPDATE/CANCEL/DELETE
    actorUserId: { type: DataTypes.BIGINT, allowNull: true },
    meta: { type: DataTypes.JSON, allowNull: true, defaultValue: {} },
}, {
    tableName: 'audit_logs',
    timestamps: true,
    updatedAt: false
});

module.exports = AuditLog;
