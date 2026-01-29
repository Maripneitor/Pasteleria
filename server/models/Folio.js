const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Folio = sequelize.define('Folio', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },

  // Identificador de folio (muy recomendado)
  folio_numero: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },

  // Datos del Cliente
  cliente_nombre: { type: DataTypes.STRING, allowNull: false },
  cliente_telefono: { type: DataTypes.STRING, allowNull: false },
  cliente_telefono_extra: { type: DataTypes.STRING },

  // Entrega
  fecha_entrega: { type: DataTypes.DATEONLY, allowNull: false }, // YYYY-MM-DD
  hora_entrega: { type: DataTypes.STRING, allowNull: false },   // HH:mm

  // Ubicación
  deliveryLocation: { type: DataTypes.STRING }, // Keeping this mixed as user didn't specify, but controller uses p.deliveryLocation in some places? No, Controller 372 doesn't show it. 
  // Wait, Controller 372 CreateFolio doesn't explicitly list deliveryLocation in the create object?
  // It has `diseno_metadata` and `descripcion_diseno`.
  // I'll keep `deliveryLocation` or map it. Let's look at the payload in Section 4: `entrega: { ... }` inside `diseno_metadata`? 
  // No, `diseno_metadata` has `entrega: { ... }`. 
  // I will add `ubicacion_entrega` or similar if needed, or rely on JSON `diseno_metadata`.
  // To be safe, I'll keep `deliveryLocation` as `ubicacion_entrega` to match Spanish style if possible, or just keep as is?
  // User 372 CREATE controller doesn't seem to use `deliveryLocation` column. It might be in `diseno_metadata` or just omitted in the snippet.
  // I'll leave `ubicacion_entrega` (string) just in case.
  ubicacion_entrega: { type: DataTypes.STRING },

  // Especificaciones
  tipo_folio: { type: DataTypes.STRING, defaultValue: 'Normal' },
  forma: { type: DataTypes.STRING },
  numero_personas: { type: DataTypes.INTEGER },

  // Arrays (JSON in MySQL)
  sabores_pan: { type: DataTypes.JSON },
  rellenos: { type: DataTypes.JSON },
  complementos: { type: DataTypes.JSON },

  // Diseño
  descripcion_diseno: { type: DataTypes.TEXT },
  imagen_referencia_url: { type: DataTypes.STRING },
  diseno_metadata: { type: DataTypes.JSON },

  // Económicos
  costo_base: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  costo_envio: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  anticipo: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  total: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },

  // Status Pagos
  estatus_pago: { type: DataTypes.STRING, defaultValue: 'Pendiente' },

  // Status Producción
  estatus_produccion: { type: DataTypes.STRING, defaultValue: 'Pendiente' },

  // Control general (nuevo)
  estatus_folio: {
    type: DataTypes.ENUM('Activo', 'Cancelado'),
    defaultValue: 'Activo'
  },
  cancelado_en: { type: DataTypes.DATE, allowNull: true },
  motivo_cancelacion: { type: DataTypes.STRING, allowNull: true },

  // Tenant
  tenantId: { type: DataTypes.INTEGER, defaultValue: 1 }

}, {
  tableName: 'folios',
  timestamps: true
});

module.exports = Folio;