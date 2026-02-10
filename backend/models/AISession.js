const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const AISession = sequelize.define('AISession', {
  whatsappConversation: {
    type: DataTypes.TEXT('long'),
    allowNull: false,
    comment: 'El texto completo de la conversación con el cliente.'
  },
  extractedData: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Objeto JSON con los datos del folio, que se irá actualizando.'
  },
  imageUrls: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Array con las rutas de las imágenes descargadas.'
  },
  chatHistory: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Historial de la conversación entre el empleado y la IA.'
  },
  status: {
    type: DataTypes.ENUM('active', 'completed', 'cancelled'),
    defaultValue: 'active'
  },
  needsHuman: { type: DataTypes.BOOLEAN, defaultValue: false },
  priority: { type: DataTypes.ENUM('normal', 'alta', 'urgente'), defaultValue: 'normal' },
  customerPhone: { type: DataTypes.STRING, allowNull: true },
  customerName: { type: DataTypes.STRING, allowNull: true },
  // Multi-tenant & User Ownership
  tenantId: {
    type: DataTypes.INTEGER,
    allowNull: true // Allow null for legacy/public sessions if any
  },
  userId: { // Renaming or aliasing responsibleUserId? Let's keep consistency with controller
    type: DataTypes.INTEGER,
    allowNull: true
  },
  responsibleUserId: { // Explicit field if needed, or just map to userId
    type: DataTypes.INTEGER,
    allowNull: true
  },
  summary: DataTypes.STRING // Title of the session
}, { tableName: 'ai_sessions' });

module.exports = AISession;