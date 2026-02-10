const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Product = sequelize.define('Product', {
    tenantId: { type: DataTypes.BIGINT, allowNull: false, defaultValue: 1 },
    name: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT },
    basePrice: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    category: { type: DataTypes.STRING, defaultValue: 'General' },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
}, {
    tableName: 'products',
    timestamps: true
});

module.exports = Product;
