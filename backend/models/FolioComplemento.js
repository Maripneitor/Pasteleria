const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const FolioComplemento = sequelize.define('FolioComplemento', {
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
    },
    folioId: {
        type: DataTypes.BIGINT,
        allowNull: false
    },
    personas: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    forma: {
        type: DataTypes.STRING,
        allowNull: true
    },
    sabor_pan: {
        type: DataTypes.STRING, // Can be ID or text
        allowNull: true
    },
    relleno: {
        type: DataTypes.STRING, // Can be ID or text
        allowNull: true
    },
    precio: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0
    },
    descripcion: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'folio_complementos',
    timestamps: true
});

module.exports = FolioComplemento;
