const { sequelize } = require('../config/database');
const Folio = require('../models/Folio');
const auditService = require('./auditService');
const saasCommissionService = require('./saasCommissionService');
const dailyStatsService = require('./dailyStatsService');

// State Machine Definitions
const ALLOWED_TRANSITIONS = {
    'DRAFT': ['CONFIRMED', 'CANCELLED'],
    'CONFIRMED': ['IN_PRODUCTION', 'CANCELLED'],
    'IN_PRODUCTION': ['READY'], // Can cancel in production? Business rules vary. Prompt says "CANCELLED (desde DRAFT/CONFIRMED)".
    'READY': ['DELIVERED'],
    'DELIVERED': [],
    'CANCELLED': []
};

class OrderFlowService {

    /**
     * Creates a new order in DRAFT status.
     * @param {Object} data - Payload (similar to basic create)
     * @param {Object} user - Request user
     * @returns {Object} Created Folio
     */
    async createDraft(data, user) {
        return await sequelize.transaction(async (t) => {
            // 1. Prepare Data
            const folioData = {
                ...data,
                // Generate Folio Number if missing (DRAFT-TIMESTAMP-RANDOM)
                folioNumber: data.folioNumber || `DRAFT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                tenantId: user.tenantId,
                branchId: user.branchId, // Enforce branch
                responsibleUserId: user.id,
                status: 'DRAFT',
                estatus_folio: 'Activo', // Legacy sync
                estatus_produccion: 'Pendiente' // Legacy sync
            };

            // 2. Create Folio
            const folio = await Folio.create(folioData, { transaction: t });

            // 3. Audit Log
            await auditService.log(
                'CREATE_DRAFT',
                'FOLIO',
                folio.id,
                { tenantId: user.tenantId, folioNumber: folio.folioNumber },
                user.id,
                { transaction: t }
            );

            return folio;
        });
    }

    /**
     * Confirms an order (DRAFT -> CONFIRMED).
     * @param {number} folioId 
     * @param {Object} user 
     */
    async confirmOrder(folioId, user) {
        return await sequelize.transaction(async (t) => {
            const folio = await Folio.findOne({
                where: { id: folioId, tenantId: user.tenantId },
                lock: t.LOCK.UPDATE,
                transaction: t
            });

            if (!folio) throw new Error('Folio not found');

            if (folio.status !== 'DRAFT') {
                throw new Error(`Invalid transition: Cannot confirm from ${folio.status}`);
            }

            // Update Status
            folio.status = 'CONFIRMED';
            // Sync Legacy
            folio.estatus_folio = 'Activo';

            await folio.save({ transaction: t });

            // Audit
            await auditService.log(
                'CONFIRM_ORDER',
                'FOLIO',
                folio.id,
                { tenantId: user.tenantId, prevStatus: 'DRAFT' },
                user.id,
                { transaction: t }
            );

            // --- HOOKS ---
            // 4. Register Commission (SaaS)
            await saasCommissionService.processOrderCommission(folio, t);

            // 5. Update Daily Stats (Confirmed Sale)
            await dailyStatsService.registerSale(folio, t);

            return folio;
        });
    }

    /**
     * Generic status transition with validation
     * @param {number} folioId 
     * @param {string} toStatus 
     * @param {Object} user 
     */
    async transitionStatus(folioId, toStatus, user) {
        return await sequelize.transaction(async (t) => {
            const folio = await Folio.findOne({
                where: { id: folioId, tenantId: user.tenantId },
                lock: t.LOCK.UPDATE,
                transaction: t
            });

            if (!folio) throw new Error('Folio not found');

            const current = folio.status;
            const allowed = ALLOWED_TRANSITIONS[current] || [];

            if (!allowed.includes(toStatus)) {
                // If special case: Force allow ADMIN? (User didn't specify, sticking to strict)
                throw new Error(`Invalid transition: ${current} -> ${toStatus}. Allowed: [${allowed.join(', ')}]`);
            }

            folio.status = toStatus;

            // Legacy Mapping
            if (toStatus === 'CANCELLED') {
                folio.estatus_folio = 'Cancelado';
                folio.cancelado_en = new Date();
                folio.motivo_cancelacion = 'OrderFlow Transition';
            } else if (toStatus === 'DELIVERED') {
                folio.estatus_produccion = 'Entregado'; // or similar
            }

            await folio.save({ transaction: t });

            await auditService.log(
                `STATUS_${toStatus}`,
                'FOLIO',
                folio.id,
                { tenantId: user.tenantId, from: current, to: toStatus },
                user.id,
                { transaction: t }
            );

            // Re-trigger commission check on IN_PRODUCTION (as prompts says "CONFIRMED/IN_PRODUCTION")
            if (toStatus === 'IN_PRODUCTION' || toStatus === 'CONFIRMED') {
                // Idempotency allows re-running
                await saasCommissionService.processOrderCommission(folio, t);
            }

            // Re-trigger Daily Stats if Delivered (Update prompt said: "Al cambiar a DELIVERED... actualizar stats")
            if (toStatus === 'DELIVERED') {
                // If we count at CONFIRMED, maybe DELIVERED shouldn't count? 
                // Logic chosen: count at CONFIRMED. 
                // If I also run it at DELIVERED, it will double count "ordersCount" since I used increment logic?
                // My DailyStats logic uses `ordersCount = stats.ordersCount + 1`. This IS NOT IDEMPOTENT.
                // Correct logic for DailyStatsService.registerSale should probably verify if this folio was already counted?
                // OR I rely on the fact that DRAFT->CONFIRMED happens once.
                // If I call it here again for other states, it might double count.
                // I will stick to calling it ONLY in 'confirmOrder' (since that is the "Sale").
                // The prompt said: "Al cambiar a DELIVERED (o CONFIRMED...)"
                // I implemented it in confirmOrder. I will NOT add it here to avoid double counting.
            }

            return folio;
        });
    }
}

module.exports = new OrderFlowService();
