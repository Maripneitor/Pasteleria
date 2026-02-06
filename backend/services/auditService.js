const AuditLog = require('../models/AuditLog');

/**
 * Logs a system event.
 * @param {string} action - Action name (e.g. 'CREATE', 'UPDATE', 'LOGIN')
 * @param {string} entity - Entity name (e.g. 'USER', 'FOLIO', 'REPORT')
 * @param {number} entityId - ID of the entity
 * @param {Object} meta - Additional metadata
 * @param {number|null} userId - ID of the user performing the action
 */
exports.log = async (action, entity, entityId, meta = {}, userId = null, options = {}) => {
    try {
        await AuditLog.create({
            action,
            entity,
            entityId,
            meta,
            actorUserId: userId,
            tenantId: meta ? meta.tenantId : null // Ensure tenantId is captured if passed in meta
        }, options);
    } catch (e) {
        // If transaction provided, let error bubble up? 
        // User said "if something fails => rollback total". 
        // If audit fails, the whole transaction should fail.
        // But current implementation catches error. 
        // I should rethrow if transaction is present to ensure atomicity.
        if (options.transaction) throw e;
        console.error("⚠️ Audit Log Failed:", e.message);
    }
};
