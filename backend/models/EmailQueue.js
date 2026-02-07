const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const EmailQueue = sequelize.define('EmailQueue', {
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
    },
    tenantId: {
        type: DataTypes.BIGINT,
        allowNull: true,
        comment: 'Optional: Tenant ID for multi-tenant isolation'
    },
    to: {
        type: DataTypes.STRING(320),
        allowNull: false
    },
    subject: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    html: {
        type: DataTypes.TEXT('long'), // or LONGTEXT in MySQL
        allowNull: false
    },
    text: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    status: {
        type: DataTypes.ENUM('PENDING', 'PROCESSING', 'SENT', 'FAILED'),
        defaultValue: 'PENDING'
    },
    attempts: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    maxAttempts: {
        type: DataTypes.INTEGER,
        defaultValue: 3
    },
    nextAttemptAt: {
        type: DataTypes.DATE,
        allowNull: true
    },
    sentAt: {
        type: DataTypes.DATE,
        allowNull: true
    },
    lastError: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    meta: {
        type: DataTypes.JSON, // MySQL 8 supports JSON
        allowNull: true
    }
}, {
    tableName: 'email_queue',
    timestamps: true,
    indexes: [
        {
            fields: ['status', 'nextAttemptAt', 'attempts'],
            name: 'email_queue_poll_idx'
        },
        {
            fields: ['tenantId'],
            name: 'email_queue_tenant_idx'
        }
    ]
});

module.exports = EmailQueue;
