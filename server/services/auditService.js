const AuditLog = require('../models/AuditLog');

/**
 * Logs a system event.
 * @param {string} action - Action name (e.g. 'CREATE', 'UPDATE', 'LOGIN')
 * @param {string} entity - Entity name (e.g. 'USER', 'FOLIO', 'REPORT')
 * @param {number} entityId - ID of the entity
 * @param {Object} meta - Additional metadata
 * @param {number|null} userId - ID of the user performing the action
 */
exports.log = async (action, entity, entityId, meta = {}, userId = null) => {
    try {
        await AuditLog.create({
            action,
            entity,
            entityId,
            meta,
            actorUserId: userId
        });
    } catch (e) {
        console.error("⚠️ Audit Log Failed:", e.message);
    }
};
