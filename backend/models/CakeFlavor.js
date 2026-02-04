const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const CakeFlavor = sequelize.define('CakeFlavor', {
    tenantId: { type: DataTypes.BIGINT, allowNull: false, defaultValue: 1 },
    name: { type: DataTypes.STRING, allowNull: false },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
}, {
    tableName: 'cake_flavors',
    timestamps: true
});

module.exports = CakeFlavor;
