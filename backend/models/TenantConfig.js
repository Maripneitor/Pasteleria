const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const TenantConfig = sequelize.define('TenantConfig', {
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
    },
    tenantId: {
        type: DataTypes.BIGINT,
        allowNull: false,
        unique: true,
        comment: 'Foreign key to Tenant. One-to-one relationship.'
    },
    logoUrl: {
        type: DataTypes.STRING(2048), // Allow longer URLs/DataURIs
        allowNull: true
    },
    primaryColor: {
        type: DataTypes.STRING(16),
        allowNull: true,
        validate: {
            is: /^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$/i // Hex color validation
        }
    },
    footerText: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    businessName: {
        type: DataTypes.STRING(255),
        allowNull: true
    }
}, {
    tableName: 'tenant_configs',
    timestamps: true
});

module.exports = TenantConfig;
