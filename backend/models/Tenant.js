const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Tenant = sequelize.define('Tenant', {
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
    },
    businessName: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'Mi Pastelería'
    },
    logoUrl: {
        type: DataTypes.STRING,
        comment: 'URL o Base64 del logo'
    },
    primaryColor: {
        type: DataTypes.STRING(7),
        defaultValue: '#ec4899'
    },
    pdfHeaderText: {
        type: DataTypes.TEXT
    },
    pdfFooterText: {
        type: DataTypes.TEXT
    },
    website: {
        type: DataTypes.STRING
    },
    maxBranches: {
        type: DataTypes.INTEGER,
        defaultValue: 2,
        comment: 'Limit the number of branches this tenant can create'
    }
}, {
    tableName: 'tenants',
    timestamps: true
});

module.exports = Tenant;
