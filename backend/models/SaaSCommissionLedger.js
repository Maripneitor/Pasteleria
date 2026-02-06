const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const SaaSCommissionLedger = sequelize.define('SaaSCommissionLedger', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    tenantId: { type: DataTypes.BIGINT, allowNull: false },
    branchId: { type: DataTypes.BIGINT, allowNull: true },
    sourceFolioId: { type: DataTypes.BIGINT, allowNull: false },

    orderTotalSnapshot: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    commissionAmount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },

    status: {
        type: DataTypes.ENUM('PENDING', 'BILLED', 'PAID', 'ADJUSTMENT'), // Added ADJUSTMENT specifically
        defaultValue: 'PENDING'
    },

    meta: { type: DataTypes.JSON, defaultValue: {} }, // For alerts or adjustment reasons

    // createdAt serves as 'immutable' timestamp
}, {
    tableName: 'saas_commission_ledger',
    timestamps: true,
    updatedAt: true,
    indexes: [
        {
            unique: false,
            fields: ['tenantId', 'sourceFolioId']
        }
    ]
});

module.exports = SaaSCommissionLedger;
