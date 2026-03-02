const { SaaSContract, SaaSCommissionLedger, AuditLog } = require('../models');
const { Op } = require('sequelize');

class SaaSCommissionService {

    /**
     * Ensures calculation of commission for a confirmed order.
     * @param {Object} folio - Order object
     * @param {Object} transaction - Sequelize transaction
     */
    async processOrderCommission(folio, transaction) {
        const { tenantId, id: folioId, total, branchId } = folio;

        // 1. Get Contract
        let contract = await SaaSContract.findOne({ where: { tenantId }, transaction });
        if (!contract) {
            // Create Default Contract (e.g. 5% monthly)
            contract = await SaaSContract.create({
                tenantId,
                commissionType: 'PERCENTAGE',
                rateValue: 5.00,
                billingCycle: 'MONTHLY'
            }, { transaction });
        }

        if (!contract.isActive) return; // Suspended billing

        // 2. Calculate Expected Commission
        let commissionAmount = 0;
        const orderTotal = Number(total);

        if (contract.commissionType === 'PERCENTAGE') {
            commissionAmount = orderTotal * (Number(contract.rateValue) / 100);
        } else {
            commissionAmount = Number(contract.rateValue);
        }

        // 3. Check for existing ledger
        const existing = await SaaSCommissionLedger.findOne({
            where: { tenantId, sourceFolioId: folioId },
            transaction
        });

        if (!existing) {
            // CREATE NEW
            await SaaSCommissionLedger.create({
                tenantId,
                branchId,
                sourceFolioId: folioId,
                orderTotalSnapshot: orderTotal,
                commissionAmount,
                status: 'PENDING',
                meta: { type: 'ORIGINAL', rate: contract.rateValue }
            }, { transaction });

        } else {
            // IDEMPOTENCY / ANTI-FRAUD CHECK
            const prevTotal = Number(existing.orderTotalSnapshot);

            if (orderTotal === prevTotal) {
                // No change, ignore
                return;
            } else if (orderTotal > prevTotal) {
                // UPSELL: Create Adjustment
                const diffTotal = orderTotal - prevTotal;
                let diffComm = 0;
                if (contract.commissionType === 'PERCENTAGE') {
                    diffComm = diffTotal * (Number(contract.rateValue) / 100);
                }
                // We create a new ledger entry as ADJUSTMENT? Or update existing?
                // Model allows multiple entries per folio? 
                // Index is specific: fields: ['tenantId', 'sourceFolioId'] unique: false.
                // So we can insert another row.
                await SaaSCommissionLedger.create({
                    tenantId,
                    branchId,
                    sourceFolioId: folioId,
                    orderTotalSnapshot: diffTotal,
                    commissionAmount: diffComm,
                    status: 'ADJUSTMENT',
                    meta: { type: 'UPSELL', originalLedgerId: existing.id }
                }, { transaction });

                // Also update the original snapshot? No, better to keep audit trail.

            } else {
                // DOWNSELL / POTENTIAL FRAUD
                // Capture Alert in AuditLog
                await AuditLog.create({
                    tenantId,
                    entity: 'SAAS_ALERT',
                    entityId: folioId,
                    action: 'COMMISSION_MISMATCH',
                    meta: {
                        message: 'Order total decreased after commission registration',
                        prev: prevTotal,
                        curr: orderTotal,
                        ledgerId: existing.id
                    },
                    actorUserId: null
                }, { transaction });

                // NOTIFICACIÓN CRÍTICA (Fire & Forget or non-blocking)
                const { sendEmail } = require('./emailService');
                sendEmail({
                    to: process.env.ADMIN_EMAIL || 'admin@pasteleria.com',
                    subject: `🚨 ALERTA SAAS: Discrepancia en Folio ${folioId} (Tenant ${tenantId})`,
                    html: `
                        <h2>Discrepancia detectada en comisión</h2>
                        <p>El total del pedido disminuyó después del registro inicial.</p>
                        <ul>
                            <li><b>Folio:</b> ${folioId}</li>
                            <li><b>Tenant:</b> ${tenantId}</li>
                            <li><b>Total previo:</b> $${prevTotal}</li>
                            <li><b>Total actual:</b> $${orderTotal}</li>
                        </ul>
                        <p>Revisa el historial de auditoría para más detalles.</p>
                    `
                }).catch(e => console.error("Email Alert Fail:", e.message));
            }
        }
    }
}

module.exports = new SaaSCommissionService();
