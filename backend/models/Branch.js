const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Branch = sequelize.define('Branch', {
    id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    address: {
        type: DataTypes.STRING,
        allowNull: true
    },
    phone: {
        type: DataTypes.STRING,
        allowNull: true
    },
    tenantId: {
        type: DataTypes.BIGINT,
        allowNull: false,
        comment: 'FK to Tenant'
    },
    isMain: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, {
    tableName: 'branches',
    timestamps: true
});

module.exports = Branch;
