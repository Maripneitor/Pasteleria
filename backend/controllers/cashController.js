const { CashCut, CashMovement } = require('../models/CashModels');
const { Op } = require('sequelize');

async function getOrCreateDailyCut(date, tenantId, branchId) {
    const [cut] = await CashCut.findOrCreate({
        where: { date, tenantId, branchId },
        defaults: {
            status: 'Open',
            totalIncome: 0,
            totalExpense: 0,
            finalBalance: 0,
            tenantId,
            branchId
        }
    });
    return cut;
}

exports.getDailySummary = async (req, res) => {
    try {
        const date = req.query.date || new Date().toISOString().split('T')[0];
        const tenantId = req.user.tenantId;
        const branchId = req.query.branchId || req.user.branchId;

        if (!tenantId) return res.status(400).json({ message: 'Tenant context required' });

        const cut = await getOrCreateDailyCut(date, tenantId, branchId);

        const movements = await CashMovement.findAll({
            where: { cashCutId: cut.id, tenantId, branchId },
            order: [['createdAt', 'DESC']]
        });

        res.json({ cut, movements });
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Error getting summary' });
    }
};

exports.addMovement = async (req, res) => {
    try {
        const { type, amount, category, description, referenceId, date } = req.body;
        const targetDate = date || new Date().toISOString().split('T')[0];
        const user = req.user;
        const tenantId = user.tenantId;
        const branchId = req.body.branchId || user.branchId;

        const cut = await getOrCreateDailyCut(targetDate, tenantId, branchId);
        if (cut.status === 'Closed') return res.status(400).json({ message: 'Caja cerrada para este día.' });

        const movement = await CashMovement.create({
            cashCutId: cut.id,
            tenantId,
            branchId,
            type,
            amount,
            category,
            description,
            referenceId,
            performedByUserId: user.id
        });

        // Recalcular
        const val = Number(amount);
        if (type === 'Income') {
            cut.totalIncome = Number(cut.totalIncome) + val;
            cut.finalBalance = Number(cut.finalBalance) + val;
        } else {
            cut.totalExpense = Number(cut.totalExpense) + val;
            cut.finalBalance = Number(cut.finalBalance) - val;
        }
        await cut.save();

        // AUDIT (Optional, for transparency)
        const auditService = require('../services/auditService');
        auditService.log('ADD_CASH_MOVEMENT', 'CASH_MOVEMENT', movement.id, { amount, type, branchId }, user.id);

        res.status(201).json(movement);
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Error adding movement' });
    }
};

exports.closeDay = async (req, res) => {
    try {
        const { date, notes, branchId } = req.body;
        const tenantId = req.user.tenantId;
        const targetBranchId = branchId || req.user.branchId;

        const cut = await CashCut.findOne({ where: { date, tenantId, branchId: targetBranchId } });
        if (!cut) return res.status(404).json({ message: 'No hay corte para cerrar en esta sucursal' });

        cut.status = 'Closed';
        cut.closedAt = new Date();
        cut.closedByUserId = req.user.id;
        cut.notes = notes;
        await cut.save();

        // 🚀 Disparo de correo (Redundancia evento)
        // No esperamos (fire & forget) o esperamos pero no fallamos request?
        // El prompt dice "NO romper cierre".
        // Lo haremos sin 'await' bloqueante si es posible, o await en try/catch.
        // Node es single thread, 'await' bloqueará, pero es rápido. Mejor 'await' para logging correcto.
        try {
            const { processDailyCutEmail } = require('../services/dailyCutEmailService');
            const { buildTenantWhere, buildBranchWhere } = require('../utils/tenantScope');

            await processDailyCutEmail({
                date: cut.date,
                userId: req.user.id,
                tenantFilter: { tenantId },
                branchFilter: { branchId: targetBranchId }
            });
        } catch (mailError) {
            console.error("⚠️ Error enviando correo automático al cierre:", mailError);
        }

        res.json(cut);
    } catch (e) {
        res.status(500).json({ message: 'Error closing day' });
    }
};
