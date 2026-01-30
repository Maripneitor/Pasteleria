const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Filling = sequelize.define('Filling', {
    tenantId: { type: DataTypes.BIGINT, allowNull: false, defaultValue: 1 },
    name: { type: DataTypes.STRING, allowNull: false },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
}, {
    tableName: 'fillings',
    timestamps: true
});

module.exports = Filling;
