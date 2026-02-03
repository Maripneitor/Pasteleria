const { sequelize } = require('../config/database');
const User = require('./user');
const Client = require('./client');
const Folio = require('./Folio');
const FolioEditHistory = require('./FolioEditHistory');
const Commission = require('./Commission');
const AISession = require('./AISession'); // Modelo nuevo para las sesiones de chat
const Flavor = require('./Flavor');
const Filling = require('./Filling');


const Ingredient = require('./Ingredient');
const CakeFlavor = require('./CakeFlavor');

const AuditLog = require('./AuditLog');
const { CashCut, CashMovement } = require('./CashModels');

// --- Sprint 4: Control & Limits ---
const ActivationCode = require('./ActivationCode');
const UserSession = require('./UserSession');
const PdfTemplate = require('./PdfTemplate');

// --- Relaciones Principales ---
User.hasMany(Folio, { foreignKey: 'responsibleUserId' });
Folio.belongsTo(User, { as: 'responsibleUser', foreignKey: 'responsibleUserId', onDelete: 'SET NULL' });

Client.hasMany(Folio, { foreignKey: 'clientId' });
Folio.belongsTo(Client, { as: 'client', foreignKey: 'clientId', onDelete: 'SET NULL' });

// --- Relación para Comisiones ---
Folio.hasOne(Commission, { foreignKey: 'folioId', as: 'commission' });
Commission.belongsTo(Folio, { foreignKey: 'folioId', as: 'folio' });

// --- Relaciones para el Historial de Edición ---
Folio.hasMany(FolioEditHistory, { as: 'editHistory', foreignKey: 'folioId' });
FolioEditHistory.belongsTo(Folio, { foreignKey: 'folioId' });

User.hasMany(FolioEditHistory, { foreignKey: 'editorUserId' });
FolioEditHistory.belongsTo(User, { as: 'editor', foreignKey: 'editorUserId' });

// --- Relaciones Auditoría ---
User.hasMany(AuditLog, { foreignKey: 'actorUserId', as: 'auditLogs' });
AuditLog.belongsTo(User, { foreignKey: 'actorUserId', as: 'actor' });

// --- Relaciones Caja ---
CashMovement.belongsTo(CashCut, { foreignKey: 'cashCutId' });
CashCut.hasMany(CashMovement, { foreignKey: 'cashCutId' });

User.hasMany(CashMovement, { foreignKey: 'performedByUserId' });
CashMovement.belongsTo(User, { as: 'performer', foreignKey: 'performedByUserId' });

// --- Relaciones AI Session ---
User.hasMany(AISession, { foreignKey: 'userId', as: 'aiSessions' });
AISession.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// --- Relaciones Sprint 4 (Control) ---
// Owner generates codes
User.hasMany(ActivationCode, { foreignKey: 'ownerId', as: 'generatedCodes' });
ActivationCode.belongsTo(User, { foreignKey: 'ownerId', as: 'owner' });

// User has sessions
User.hasMany(UserSession, { foreignKey: 'userId', as: 'sessions' });
UserSession.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// --- Exportación de todos los modelos ---
module.exports = {
  sequelize,
  User,
  Client,
  Folio,
  FolioEditHistory,
  Commission,
  AISession,
  Flavor,
  Filling,
  Ingredient,
  CakeFlavor,
  AuditLog,
  CashCut,
  CashMovement,
  ActivationCode,
  UserSession,
  PdfTemplate
};