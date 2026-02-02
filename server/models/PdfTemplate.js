const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PdfTemplate = sequelize.define('PdfTemplate', {
    id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    tenantId: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
        allowNull: false
    },
    isDefault: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    configJson: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: {},
        comment: 'JSON con configuración visual: { logoUrl, primaryColor, showFields: [], footerText }'
    }
}, {
    tableName: 'pdf_templates',
    timestamps: true
});

module.exports = PdfTemplate;
