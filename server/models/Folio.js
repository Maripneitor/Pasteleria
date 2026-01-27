const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Folio = sequelize.define('Folio', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  // Datos del Cliente (Snapshot para no perder info si el cliente cambia)
  cliente_nombre: { type: DataTypes.STRING, allowNull: false },
  cliente_telefono: { type: DataTypes.STRING, allowNull: false },
  cliente_telefono_extra: { type: DataTypes.STRING },

  // Detalles Generales
  fecha_entrega: { type: DataTypes.DATEONLY, allowNull: false },
  hora_entrega: { type: DataTypes.STRING, allowNull: false }, // Ej: "14:30"
  tipo_folio: { type: DataTypes.ENUM('Normal', 'Especial'), defaultValue: 'Normal' },

  // Especificaciones del Pastel (JSON para flexibilidad)
  forma: { type: DataTypes.STRING },
  numero_personas: { type: DataTypes.INTEGER },
  sabores_pan: { type: DataTypes.JSON }, // Ej: ["Vainilla", "Chocolate"]
  rellenos: { type: DataTypes.JSON },    // Ej: ["Fresa", "Nuez"]
  complementos: { type: DataTypes.JSON }, // Ej: ["Cupcakes", "Gelatina"]

  // Diseño
  descripcion_diseno: { type: DataTypes.TEXT },
  imagen_referencia_url: { type: DataTypes.STRING }, // Ruta del archivo subido
  diseno_metadata: { type: DataTypes.JSON }, // Ej: { altura_extra: true, dedicatoria: "Felicidades" }

  // Económicos
  costo_base: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  costo_envio: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  anticipo: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  total: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  estatus_pago: { type: DataTypes.ENUM('Pendiente', 'Pagado'), defaultValue: 'Pendiente' },

  // Control
  estatus_produccion: { type: DataTypes.ENUM('Pendiente', 'Horneado', 'Decorado', 'Entregado'), defaultValue: 'Pendiente' }
}, {
  tableName: 'folios',
  timestamps: true
});

module.exports = Folio;