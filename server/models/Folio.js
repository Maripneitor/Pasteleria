const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Folio = sequelize.define('Folio', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  // Datos del Cliente
  cliente_nombre: { type: DataTypes.VIRTUAL },
  cliente_telefono: { type: DataTypes.VIRTUAL },
  cliente_telefono_extra: { type: DataTypes.VIRTUAL },

  // Identificadores y Detalles DB
  folioNumber: {
    type: DataTypes.STRING,
    allowNull: false
  },
  persons: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  cakeFlavorId: {
    type: DataTypes.BIGINT,
    allowNull: false
  },
  fillingId: {
    type: DataTypes.BIGINT
  },
  deliveryLocation: {
    type: DataTypes.STRING,
    allowNull: false
  },

  // Mapeos a Español (para compatibilidad de controlador/vistas actuales)
  fecha_entrega: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: 'deliveryDate'
  },
  hora_entrega: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'deliveryTime'
  },
  tipo_folio: {
    type: DataTypes.STRING,
    defaultValue: 'Sencillo',
    field: 'folioType'
  },
  descripcion_diseno: {
    type: DataTypes.TEXT,
    field: 'designDescription'
  },

  // Virtuales
  imagen_referencia_url: { type: DataTypes.VIRTUAL },
  diseno_metadata: { type: DataTypes.VIRTUAL },
  sabores_pan: { type: DataTypes.VIRTUAL },
  rellenos: { type: DataTypes.VIRTUAL },
  complementos: { type: DataTypes.VIRTUAL },
  costo_base: { type: DataTypes.VIRTUAL },
  costo_envio: { type: DataTypes.VIRTUAL },
  anticipo: { type: DataTypes.VIRTUAL },
  estatus_pago: { type: DataTypes.VIRTUAL }, // No en tabla folios

  // Totales
  total: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },

  // Status
  estatus_produccion: {
    type: DataTypes.STRING,
    defaultValue: 'Nuevo',
    field: 'status'
  },

  // Requeridos por lógica de negocio pero mapeados a DB
  tenantId: {
    type: DataTypes.BIGINT,
    allowNull: false,
    defaultValue: 1
  }
}, {
  tableName: 'folios',
  timestamps: true
});

module.exports = Folio;