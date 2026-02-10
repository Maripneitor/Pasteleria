const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Flavor = sequelize.define('Flavor', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: false // Removed unique constraint as same flavor name can exist in different tenants
    },
    tenantId: {
        type: DataTypes.BIGINT,
        allowNull: false,
        defaultValue: 1
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    isNormal: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        comment: 'Disponible para pasteles normales'
    },
    isTier: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: 'Disponible para pisos de pasteles especiales'
    }
}, {
    tableName: 'flavors',
    timestamps: false
});

module.exports = Flavor;
