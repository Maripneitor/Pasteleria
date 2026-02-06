const { DailySalesStats } = require('../models');
const { Op } = require('sequelize');

class DailyStatsService {

    /**
     * Updates daily stats for a new confirmed/delivered order.
     * Idempotency Strategy: Relies on strictly controlled caller (OrderFlow).
     * @param {Object} folio 
     * @param {Object} transaction 
     */
    async registerSale(folio, transaction) {
        const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD (Server Time - debatable if TZ matters here, assuming UTC or Server Local)
        // User requested Mexico City. `new Date().toLocaleString("en-CA", {timeZone: "America/Mexico_City"})`.

        const mxDate = new Date().toLocaleString("en-CA", { timeZone: "America/Mexico_City" }).split(',')[0];
        // en-CA gives YYYY-MM-DD.

        const { tenantId, branchId, total } = folio;
        const amount = Number(total);

        // Upsert Logic
        const [stats, created] = await DailySalesStats.findOrCreate({
            where: { date: mxDate, tenantId, branchId: branchId || 0 }, // handle null branch? Folio enforces branchId now.
            defaults: {
                totalSales: 0,
                ordersCount: 0
            },
            transaction,
            lock: transaction.LOCK.UPDATE
        });

        stats.totalSales = Number(stats.totalSales) + amount;
        stats.ordersCount = stats.ordersCount + 1;

        await stats.save({ transaction });
    }
}

module.exports = new DailyStatsService();
