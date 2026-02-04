const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ActivationCode = sequelize.define('ActivationCode', {
    code: {
        type: DataTypes.STRING(6),
        allowNull: false,
        unique: true
    },
    ownerId: {
        type: DataTypes.BIGINT,
        allowNull: false,
        comment: 'Who generated this code (The Owner)'
    },
    tenantId: {
        type: DataTypes.BIGINT,
        allowNull: false,
        comment: 'Which tenant this code assigns to'
    },
    branchId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Which specific branch this code assigns to'
    },
    targetRole: { // Opcional: para forzarrol (ej. employee)
        type: DataTypes.STRING,
        defaultValue: 'employee'
    },
    status: {
        type: DataTypes.ENUM('UNUSED', 'USED'),
        defaultValue: 'UNUSED'
    },
    expiresAt: {
        type: DataTypes.DATE,
        allowNull: false
    },
    usedAt: {
        type: DataTypes.DATE,
        allowNull: true
    },
    usedByUserId: {
        type: DataTypes.BIGINT,
        allowNull: true
    }
}, {
    tableName: 'activation_codes'
});

module.exports = ActivationCode;
