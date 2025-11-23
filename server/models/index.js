const { sequelize } = require('../config/database');
const User = require('./user');
const Client = require('./client');
const Folio = require('./Folio');
const FolioEditHistory = require('./FolioEditHistory');
const Commission = require('./Commission');
const AISession = require('./AISession'); // Modelo nuevo para las sesiones de chat

// --- Relaciones Principales ---
User.hasMany(Folio, { foreignKey: 'responsibleUserId' });
Folio.belongsTo(User, { as: 'responsibleUser', foreignKey: 'responsibleUserId' });

Client.hasMany(Folio, { foreignKey: 'clientId' });
Folio.belongsTo(Client, { as: 'client', foreignKey: 'clientId' });

// --- Relación para Comisiones ---
Folio.hasOne(Commission, { foreignKey: 'folioId', as: 'commission' });
Commission.belongsTo(Folio, { foreignKey: 'folioId', as: 'folio' });

// --- Relaciones para el Historial de Edición ---
Folio.hasMany(FolioEditHistory, { as: 'editHistory', foreignKey: 'folioId' });
FolioEditHistory.belongsTo(Folio, { foreignKey: 'folioId' });

User.hasMany(FolioEditHistory, { foreignKey: 'editorUserId' });
FolioEditHistory.belongsTo(User, { as: 'editor', foreignKey: 'editorUserId' });

// --- Exportación de todos los modelos ---
module.exports = {
  sequelize,
  User,
  Client,
  Folio,
  FolioEditHistory,
  Commission,
  AISession
};