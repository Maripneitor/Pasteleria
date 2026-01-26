const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Folio = sequelize.define('Folio', {
  id: {
    type: DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey: true
  },
  folioNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  folioType: {
    type: DataTypes.ENUM('Normal', 'Base/Especial'),
    allowNull: false
  },
  deliveryDate: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  deliveryTime: {
    type: DataTypes.TIME,
    allowNull: false
  },
  persons: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  shape: {
    type: DataTypes.STRING,
    allowNull: false
  },
  cakeFlavor: {
    type: DataTypes.JSON,
    allowNull: true
  },
  filling: {
    type: DataTypes.JSON,
    allowNull: true
  },
  designDescription: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  dedication: {
    type: DataTypes.STRING,
    allowNull: true
  },
  deliveryLocation: {
    type: DataTypes.STRING,
    allowNull: true
  },
  deliveryCost: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  total: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  advancePayment: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0
  },
  balance: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  // --- MODIFICACIÓN APLICADA ---
  // Se añade el nuevo estado 'Pendiente' para los folios generados por la IA
  // que están esperando confirmación humana.
  status: {
    type: DataTypes.ENUM('Pendiente', 'Nuevo', 'En Producción', 'Listo para Entrega', 'Entregado', 'Cancelado'),
    defaultValue: 'Nuevo'
  },
  imageUrls: {
    type: DataTypes.JSON,
    allowNull: true
  },
  imageComments: {
    type: DataTypes.JSON,
    allowNull: true
  },
  tiers: {
    type: DataTypes.JSON,
    allowNull: true
  },
  accessories: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  additional: {
    type: DataTypes.JSON,
    allowNull: true
  },
  complements: {
    type: DataTypes.JSON,
    allowNull: true
  },
  isPaid: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  hasExtraHeight: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  isPrinted: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  fondantChecked: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  dataChecked: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  }
}, { tableName: 'folios' });

module.exports = Folio;