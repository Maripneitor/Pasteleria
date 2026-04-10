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
  deliveryLocation: { type: DataTypes.STRING }, 
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
  
  // 🍰 NUEVOS CAMPOS PARA FLUJO AVANZADO
  detallesPisos: { type: DataTypes.JSON, comment: 'Arreglo con los sabores y rellenos por piso' },
  complementarios: { type: DataTypes.JSON, comment: 'Arreglo de pasteles extra independientes' },

  // Diseño
  descripcion_diseno: { type: DataTypes.TEXT },
  dedicatoria: { type: DataTypes.TEXT },
  imagen_referencia_url: { type: DataTypes.STRING }, // Mantenemos por compatibilidad (legacy)
  diseno_metadata: { type: DataTypes.JSON },

  // Económicos
  costo_base: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  costo_envio: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  anticipo: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  total: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  aplica_comision: { type: DataTypes.BOOLEAN, defaultValue: false }, // 🔥 FIX: Agregado para que Sequelize lo guarde
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
  tenantId: {
    type: DataTypes.BIGINT,
    allowNull: false, // 🛡️ BLOQUEO: Ya no permitimos nulos ni default 1
  },
  branchId: { type: DataTypes.BIGINT, allowNull: true, comment: 'FK to Branch' },

  // Machine State (Strict)
  status: {
    type: DataTypes.ENUM('DRAFT', 'CONFIRMED', 'IN_PRODUCTION', 'READY', 'DELIVERED', 'CANCELLED'),
    defaultValue: 'CONFIRMED', // 🔥 EL CAMBIO
    allowNull: false
  }

}, {
  tableName: 'folios',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['tenantId', 'folio_numero'],
      name: 'uq_folios_tenant_folioNumber'
    }
  ]
});

module.exports = Folio;