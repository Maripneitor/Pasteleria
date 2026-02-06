const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Folio = sequelize.define('Folio', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },

  // Identificador de folio (muy recomendado)
  folioNumber: {
    type: DataTypes.STRING(50),
    field: 'folio_numero',
    allowNull: true,
    unique: false,
  },

  // Datos del Cliente
  cliente_nombre: { type: DataTypes.STRING, allowNull: false },
  cliente_telefono: { type: DataTypes.STRING, allowNull: false },
  cliente_telefono_extra: { type: DataTypes.STRING },

  // Referencias (Foreign Keys explícitas para evitar desajustes de tipo)
  clientId: { type: DataTypes.BIGINT, allowNull: true },
  responsibleUserId: { type: DataTypes.BIGINT, allowNull: true },

  // Entrega
  fecha_entrega: { type: DataTypes.DATEONLY, allowNull: true }, // YYYY-MM-DD
  hora_entrega: { type: DataTypes.STRING, allowNull: true },   // HH:mm

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
  ubicacion_entrega: { type: DataTypes.STRING }, // General one-line or legacy

  // Detalle de Entrega (Logística)
  is_delivery: { type: DataTypes.BOOLEAN, defaultValue: false },
  calle: { type: DataTypes.STRING, allowNull: true },
  num_ext: { type: DataTypes.STRING, allowNull: true },
  num_int: { type: DataTypes.STRING, allowNull: true },
  colonia: { type: DataTypes.STRING, allowNull: true },
  ubicacion_maps: { type: DataTypes.STRING, allowNull: true },
  referencias: { type: DataTypes.TEXT, allowNull: true },

  // Especificaciones
  tipo_folio: { type: DataTypes.STRING, defaultValue: 'Normal' },
  forma: { type: DataTypes.STRING },
  numero_personas: { type: DataTypes.INTEGER },
  altura_extra: { type: DataTypes.STRING, defaultValue: 'No' },

  // Arrays (JSON in MySQL)
  sabores_pan: { type: DataTypes.JSON },
  rellenos: { type: DataTypes.JSON },
  complementos: { type: DataTypes.JSON }, // Legacy or simple items
  accesorios: { type: DataTypes.JSON },   // New simple items list

  // Diseño
  descripcion_diseno: { type: DataTypes.TEXT },
  dedicatoria: { type: DataTypes.TEXT },
  imagen_referencia_url: { type: DataTypes.STRING },
  diseno_metadata: { type: DataTypes.JSON },

  // Económicos
  costo_base: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  costo_envio: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  anticipo: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  total: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  resta: {
    type: DataTypes.VIRTUAL,
    get() { return this.total - this.anticipo; }
  },

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
  tenantId: { type: DataTypes.BIGINT, defaultValue: 1 },
  branchId: { type: DataTypes.BIGINT, allowNull: true, comment: 'FK to Branch' },

  // Machine State (Strict)
  status: {
    type: DataTypes.ENUM('DRAFT', 'CONFIRMED', 'IN_PRODUCTION', 'READY', 'DELIVERED', 'CANCELLED'),
    defaultValue: 'DRAFT',
    allowNull: false
  }

}, {
  tableName: 'folios',
  timestamps: true
});

module.exports = Folio;