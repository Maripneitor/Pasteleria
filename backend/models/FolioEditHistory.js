const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const FolioEditHistory = sequelize.define('FolioEditHistory', {
  // El 'id' del registro, 'folioId', 'editorUserId' y 'createdAt'
  // serán creados y gestionados automáticamente por Sequelize
  // a través de las relaciones y los timestamps.
  tenantId: {
    type: DataTypes.BIGINT,
    allowNull: false
  },
  eventType: {
    type: DataTypes.STRING,
    allowNull: false
  },
  changedFields: {
    type: DataTypes.JSON,
    allowNull: false
  }
}, {
  tableName: 'folio_edit_histories',
  updatedAt: false // No necesitamos la columna 'updatedAt' en esta tabla.
});

module.exports = FolioEditHistory;