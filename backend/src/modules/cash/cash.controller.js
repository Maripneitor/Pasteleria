const { CashCut, CashMovement } = require('../../../models/CashModels');
const { Op } = require('sequelize');
const asyncHandler = require('../../core/asyncHandler');

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

exports.getDailySummary = asyncHandler(async (req, res) => {
    const date = req.query.date || new Date().toISOString().split('T')[0];
    const cut = await getOrCreateDailyCut(date);

    const movements = await CashMovement.findAll({
        where: { cashCutId: cut.id },
        order: [['createdAt', 'DESC']]
    });

    res.json({ cut, movements });
});

exports.addMovement = asyncHandler(async (req, res) => {
    const { type, amount, category, description, referenceId, date } = req.body;
    const targetDate = date || new Date().toISOString().split('T')[0];
    const user = req.user;

    const cut = await getOrCreateDailyCut(targetDate);
    if (cut.status === 'Closed') {
        const err = new Error('Caja cerrada para este día.');
        err.status = 400;
        throw err;
    }

    const movement = await CashMovement.create({
        cashCutId: cut.id,
        type,
        amount,
        category,
        description,
        referenceId,
        performedByUserId: user.id
    });

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
});

exports.closeDay = asyncHandler(async (req, res) => {
    const { date, notes } = req.body;
    const cut = await CashCut.findOne({ where: { date } });
    if (!cut) {
        const err = new Error('No hay corte para cerrar');
        err.status = 404;
        throw err;
    }

    cut.status = 'Closed';
    cut.closedAt = new Date();
    cut.closedByUserId = req.user.id;
    cut.notes = notes;
    await cut.save();

    try {
        const { processDailyCutEmail } = require('../../../services/dailyCutEmailService');
        await processDailyCutEmail({
            date: cut.date,
            userId: req.user.id
        });
    } catch (mailError) {
        console.error("⚠️ Error enviando correo automático al cierre:", mailError);
    }

    res.json(cut);
});
