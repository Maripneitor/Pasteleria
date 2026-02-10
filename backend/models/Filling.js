const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Filling = sequelize.define('Filling', {
    tenantId: { type: DataTypes.BIGINT, allowNull: false, defaultValue: 1 },
    name: { type: DataTypes.STRING, allowNull: false },
    price: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0.00 },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
}, {
    tableName: 'fillings',
    timestamps: true
});

module.exports = Filling;
