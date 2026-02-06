const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const SaaSContract = sequelize.define('SaaSContract', {
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
    },
    tenantId: {
        type: DataTypes.BIGINT,
        allowNull: false,
        unique: true // One contract per tenant
    },
    commissionType: {
        type: DataTypes.ENUM('PERCENTAGE', 'FIXED'),
        allowNull: false,
        defaultValue: 'PERCENTAGE'
    },
    rateValue: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
    },
    billingCycle: {
        type: DataTypes.ENUM('WEEKLY', 'MONTHLY'),
        defaultValue: 'MONTHLY'
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    tableName: 'saas_contracts',
    timestamps: true
});

module.exports = SaaSContract;
