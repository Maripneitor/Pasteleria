const AuditLog = require('../models/AuditLog');

// Helper para usar dentro de controladores (no middleware express per se, sino utilidad)
// Usar: await auditLogger(req.user?.id, 'UPDATE_STATUS', 'FOLIO', folio.id, { old: 'x', new: 'y' })
const auditLogger = async (userId, action, entity, entityId, meta = {}) => {
    try {
        await AuditLog.create({
            actorUserId: userId || null,
            action,
            entity,
            entityId,
            meta,
            tenantId: 1 // TODO: Dynamic tenant
        });
    } catch (e) {
        console.error("AuditLog error, proceeding safely:", e);
    }
};

module.exports = auditLogger;
