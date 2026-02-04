const { CashCut, CashMovement } = require('../models/CashModels');
const { Op } = require('sequelize');

async function getOrCreateDailyCut(date) {
    const [cut] = await CashCut.findOrCreate({
        where: { date },
        defaults: {
            status: 'Open',
            totalIncome: 0,
            totalExpense: 0,
            finalBalance: 0
        }
    });
    return cut;
}

exports.getDailySummary = async (req, res) => {
    try {
        const date = req.query.date || new Date().toISOString().split('T')[0];
        const cut = await getOrCreateDailyCut(date);

        const movements = await CashMovement.findAll({
            where: { cashCutId: cut.id },
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

        const cut = await getOrCreateDailyCut(targetDate);
        if (cut.status === 'Closed') return res.status(400).json({ message: 'Caja cerrada para este día.' });

        const movement = await CashMovement.create({
            cashCutId: cut.id,
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

        res.status(201).json(movement);
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Error adding movement' });
    }
};

exports.closeDay = async (req, res) => {
    try {
        const { date, notes } = req.body;
        const cut = await CashCut.findOne({ where: { date } });
        if (!cut) return res.status(404).json({ message: 'No hay corte para cerrar' });

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
            // Nota: processDailyCutEmail busca por fecha. 'cut.date' es string YYYY-MM-DD.
            await processDailyCutEmail({
                date: cut.date,
                userId: req.user.id
            });
        } catch (mailError) {
            console.error("⚠️ Error enviando correo automático al cierre:", mailError);
        }

        res.json(cut);
    } catch (e) {
        res.status(500).json({ message: 'Error closing day' });
    }
};
