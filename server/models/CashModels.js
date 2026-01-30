const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const CashCut = sequelize.define('CashCut', {
    date: { type: DataTypes.DATEONLY, allowNull: false, unique: true },
    totalIncome: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    totalExpense: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    finalBalance: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    closedAt: { type: DataTypes.DATE, allowNull: true },
    closedByUserId: { type: DataTypes.BIGINT, allowNull: true },
    status: { type: DataTypes.ENUM('Open', 'Closed'), defaultValue: 'Open' },
    notes: { type: DataTypes.TEXT, allowNull: true }
}, { tableName: 'cash_cuts' });

const CashMovement = sequelize.define('CashMovement', {
    type: { type: DataTypes.ENUM('Income', 'Expense'), allowNull: false },
    amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    category: { type: DataTypes.STRING, allowNull: false }, // 'Venta', 'Anticipo', 'Compra Insumos', 'Pago Servicio'
    description: { type: DataTypes.TEXT, allowNull: true },
    referenceId: { type: DataTypes.STRING, allowNull: true }, // Folio ID associated
    performedByUserId: { type: DataTypes.BIGINT, allowNull: false }
}, { tableName: 'cash_movements' });

// Relaciones (definir en index.js idealmente, pero aquí ayuda contexto)
CashMovement.belongsTo(CashCut, { foreignKey: 'cashCutId' });
CashCut.hasMany(CashMovement, { foreignKey: 'cashCutId' });

module.exports = { CashCut, CashMovement };
