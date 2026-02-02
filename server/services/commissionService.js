const Commission = require('../models/Commission');
const { Op } = require('sequelize');

/**
 * Calculates and records a commission for a given folio.
 * @param {Object} params
 * @param {string} params.folioNumber
 * @param {number} params.total - The total amount of the sale
 * @param {boolean} params.appliedToCustomer - Whether the commission was charged to the customer
 * @param {string} [params.terminalId] - Optional terminal ID
 * @returns {Promise<Commission>}
 */
const createCommission = async ({ folioNumber, total, appliedToCustomer, terminalId, userId }) => {
    // 1. Idempotency Check
    const existing = await Commission.findOne({ where: { folioNumber } });

    if (existing) {
        console.warn(`[Commission] SKIPPING creation for Folio ${folioNumber}. Commission already exists (ID: ${existing.id}).`);
        // Optional: Update if appliedToCustomer changed? 
        // For strict idempotency and safety, we return the existing one.
        // If specific update logic is needed, it goes here.
        return existing;
    }

    // 5% raw commission
    const commissionAmount = total * 0.05;

    let roundedAmount = null;

    if (appliedToCustomer) {
        roundedAmount = Number(commissionAmount.toFixed(2));
    }

    const commission = await Commission.create({
        folioNumber,
        amount: commissionAmount,
        appliedToCustomer,
        roundedAmount
    });

    console.log(`[Commission] CREATED for Folio ${folioNumber} | Total: $${total} | Comm: $${commissionAmount} | User: ${userId || 'System'} | AppliedToClient: ${appliedToCustomer}`);
    return commission;
};

/**
 * Generates a report of commissions within a date range.
 * @param {Object} params
 * @param {string} params.from - Iso Date string or Date object
 * @param {string} params.to - Iso Date string or Date object
 */
const getReport = async ({ from, to }) => {
    // Ensure dates include full range if just YYYY-MM-DD
    const [fromY, fromM, fromD] = from.split('-').map(Number);
    const startDate = new Date(fromY, fromM - 1, fromD, 0, 0, 0, 0);

    const [toY, toM, toD] = to.split('-').map(Number);
    const endDate = new Date(toY, toM - 1, toD, 23, 59, 59, 999);

    const commissions = await Commission.findAll({
        where: {
            createdAt: {
                [Op.between]: [startDate, endDate]
            }
        },
        order: [['createdAt', 'DESC']]
    });

    console.log(`[DEBUG] Querying report from ${startDate.toISOString()} to ${endDate.toISOString()}. Found: ${commissions.length}`);

    // Aggregations
    let totalCommissions = 0;
    let totalAppliedToCustomer = 0;
    let totalNotApplied = 0;

    const details = commissions.map(c => {
        const amt = parseFloat(c.amount);
        const rnd = c.roundedAmount ? parseFloat(c.roundedAmount) : 0;

        totalCommissions += amt;

        if (c.appliedToCustomer) {
            totalAppliedToCustomer += rnd;
        } else {
            totalNotApplied += amt;
        }

        return {
            folioNumber: c.folioNumber,
            amount: amt,
            appliedToCustomer: c.appliedToCustomer,
            roundedAmount: rnd,
            createdAt: c.createdAt
        };
    });

    return {
        period: { from: startDate, to: endDate },
        totalCommissions: parseFloat(totalCommissions.toFixed(2)),
        totalAppliedToCustomer: parseFloat(totalAppliedToCustomer.toFixed(2)),
        totalNotApplied: parseFloat(totalNotApplied.toFixed(2)),
        count: commissions.length,
        details
    };
};

module.exports = {
    createCommission,
    getReport
};
