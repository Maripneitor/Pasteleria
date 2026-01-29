const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Ingredient = sequelize.define('Ingredient', {
    tenantId: { type: DataTypes.INTEGER, allowNull: true },
    name: { type: DataTypes.STRING(120), allowNull: false },
    unit: { type: DataTypes.STRING(20), allowNull: false }, // kg, g, pza, lt
    stock: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0.00 },
    minStock: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0.00 },
    cost: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0.00 },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
}, { tableName: 'ingredients' });

module.exports = Ingredient;
