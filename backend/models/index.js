const { sequelize } = require('../config/database');
const User = require('./user');
const Client = require('./client');
const Folio = require('./Folio');
const FolioComplemento = require('./FolioComplemento');
const FolioEditHistory = require('./FolioEditHistory');
const Commission = require('./Commission');
const AISession = require('./AISession'); // Modelo nuevo para las sesiones de chat
const Flavor = require('./Flavor');
const Filling = require('./Filling');


const Ingredient = require('./Ingredient');
const CakeFlavor = require('./CakeFlavor');

const AuditLog = require('./AuditLog');
const { CashCut, CashMovement } = require('./CashModels');

// --- Multi-Tenant Models ---
const Tenant = require('./Tenant');
const Branch = require('./Branch');

// --- Sprint 4: Control & Limits ---
const ActivationCode = require('./ActivationCode');
const UserSession = require('./UserSession');
const PdfTemplate = require('./PdfTemplate');
const SaaSContract = require('./SaaSContract');
const SaaSCommissionLedger = require('./SaaSCommissionLedger');
const DailySalesStats = require('./DailySalesStats');

// --- Relaciones Principales ---
User.hasMany(Folio, { foreignKey: 'responsibleUserId' });
Folio.belongsTo(User, { as: 'responsibleUser', foreignKey: 'responsibleUserId', onDelete: 'SET NULL' });

Client.hasMany(Folio, { foreignKey: 'clientId' });
Folio.belongsTo(Client, { as: 'client', foreignKey: 'clientId', onDelete: 'SET NULL' });

// --- Relación para Complementos ---
Folio.hasMany(FolioComplemento, { as: 'complementosList', foreignKey: 'folioId', onDelete: 'CASCADE' });
FolioComplemento.belongsTo(Folio, { foreignKey: 'folioId', onDelete: 'CASCADE' });

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

// --- Relaciones Multi-Tenant ---
Tenant.hasMany(Branch, { foreignKey: 'tenantId', as: 'branches' });
Branch.belongsTo(Tenant, { foreignKey: 'tenantId', as: 'tenant' });

Tenant.hasMany(User, { foreignKey: 'tenantId', as: 'users' });
User.belongsTo(Tenant, { foreignKey: 'tenantId', as: 'organization' });

Branch.hasMany(User, { foreignKey: 'branchId', as: 'branchUsers' });
User.belongsTo(Branch, { foreignKey: 'branchId', as: 'assignedBranch' });

// --- Relaciones Sprint 4 (Control) ---
// Owner generates codes
User.hasMany(ActivationCode, { foreignKey: 'ownerId', as: 'generatedCodes' });
ActivationCode.belongsTo(User, { foreignKey: 'ownerId', as: 'owner' });
ActivationCode.belongsTo(Branch, { foreignKey: 'branchId', as: 'branch' });
Branch.hasMany(ActivationCode, { foreignKey: 'branchId', as: 'activationCodes' });

// User has sessions
User.hasMany(UserSession, { foreignKey: 'userId', as: 'sessions' });
UserSession.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// --- Relaciones SaaS ---
Tenant.hasOne(SaaSContract, { foreignKey: 'tenantId', as: 'saasContract' });
SaaSContract.belongsTo(Tenant, { foreignKey: 'tenantId' });

Tenant.hasMany(SaaSCommissionLedger, { foreignKey: 'tenantId', as: 'commissions' });
SaaSCommissionLedger.belongsTo(Tenant, { foreignKey: 'tenantId' });

// --- Relaciones Stats ---
Tenant.hasMany(DailySalesStats, { foreignKey: 'tenantId' });
Branch.hasMany(DailySalesStats, { foreignKey: 'branchId' });

// --- Exportación de todos los modelos ---
module.exports = {
  sequelize,
  User,
  Client,
  Folio,
  FolioComplemento,
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
  PdfTemplate,
  Tenant,
  Branch,
  SaaSContract,
  SaaSCommissionLedger,
  DailySalesStats
};