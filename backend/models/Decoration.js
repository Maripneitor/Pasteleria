const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Decoration = sequelize.define('Decoration', {
    tenantId: { type: DataTypes.BIGINT, allowNull: false, defaultValue: 1 },
    name: { type: DataTypes.STRING, allowNull: false }, // e.g. "Vela Magica", "Cake Topper"
    price: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
}, {
    tableName: 'decorations',
    timestamps: true
});

module.exports = Decoration;
