const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const UserSession = sequelize.define('UserSession', {
    userId: {
        type: DataTypes.BIGINT,
        allowNull: false
    },
    tokenSignature: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: 'Hash/Signature of JWT to identify session'
    },
    deviceInfo: {
        type: DataTypes.STRING, // User-Agent or simplified string
        allowNull: true
    },
    ip: {
        type: DataTypes.STRING,
        allowNull: true
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    lastSeenAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    expiresAt: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    tableName: 'user_sessions',
    indexes: [
        {
            fields: ['userId', 'isActive']
        }
    ]
});

module.exports = UserSession;
