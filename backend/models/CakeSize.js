const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const CakeSize = sequelize.define('CakeSize', {
    tenantId: { type: DataTypes.BIGINT, allowNull: false, defaultValue: 1 },
    name: { type: DataTypes.STRING, allowNull: false },
    price: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0.00 },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
    type: { 
        type: DataTypes.ENUM('MAIN', 'COMPLEMENTARY'), 
        allowNull: false, 
        defaultValue: 'MAIN' 
    },
}, {
    tableName: 'cake_sizes',
    timestamps: true
});

module.exports = CakeSize;
