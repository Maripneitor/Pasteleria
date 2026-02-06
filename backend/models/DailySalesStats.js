const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const DailySalesStats = sequelize.define('DailySalesStats', {
    date: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    tenantId: { type: DataTypes.BIGINT, allowNull: false },
    branchId: { type: DataTypes.BIGINT, allowNull: false },

    totalSales: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
    ordersCount: { type: DataTypes.INTEGER, defaultValue: 0 },
    topProductId: { type: DataTypes.BIGINT, allowNull: true } // Optional tracking

}, {
    tableName: 'daily_sales_stats',
    timestamps: true,
    indexes: [
        {
            unique: true,
            fields: ['date', 'tenantId', 'branchId']
        }
    ]
});

module.exports = DailySalesStats;
