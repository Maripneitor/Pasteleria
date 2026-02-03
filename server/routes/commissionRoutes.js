const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

const commissionService = require('../services/commissionService');
const emailOutboxService = require('../services/emailOutboxService');

// GET /api/commissions/report?from=YYYY-MM-DD&to=YYYY-MM-DD
router.get('/report', async (req, res) => {
    try {
        const { from, to } = req.query;
        if (!from || !to) {
            return res.status(400).json({ error: 'Parameters "from" and "to" are required.' });
        }

        const report = await commissionService.getReport({ from, to });
        res.json(report);
    } catch (error) {
        console.error("Error fetching commission report:", error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// GET /api/commissions/report/pdf?from=YYYY-MM-DD&to=YYYY-MM-DD
router.get('/report/pdf', async (req, res) => {
    try {
        const { from, to } = req.query;
        if (!from || !to) {
            return res.status(400).json({ error: 'Parameters "from" and "to" are required.' });
        }

        // Get data using existing service logic
        const { getReport } = require('../services/commissionService');
        const pdfService = require('../services/pdfService');

        const report = await getReport({ from, to });

        const buffer = await pdfService.renderCommissionsPdf({
            reportData: report.details, // Pass the array of commissions
            from,
            to
        });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="comisiones_${from}_${to}.pdf"`);
        res.setHeader('Content-Length', buffer.length);
        res.send(buffer);

    } catch (error) {
        console.error("Error generating commission PDF:", error);
        res.status(500).json({ message: 'Error generando PDF de comisiones', details: error.message });
    }
});

// POST /api/commissions/record
router.post('/record', async (req, res) => {
    try {
        const { folioNumber, total, appliedToCustomer, terminalId } = req.body;

        if (!folioNumber || total === undefined || appliedToCustomer === undefined) {
            return res.status(400).json({ error: 'Missing required fields: folioNumber, total, appliedToCustomer' });
        }

        const commission = await commissionService.createCommission({
            folioNumber,
            total,
            appliedToCustomer,
            terminalId
        });

        res.status(201).json(commission);
    } catch (error) {
        console.error("Error recording commission:", error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// POST /api/commissions/trigger-report (For Testing Outbox)
router.post('/trigger-report', async (req, res) => {
    try {
        const { date, to } = req.body;
        if (!date || !to) {
            return res.status(400).json({ error: 'date and to (email) are required' });
        }

        const result = await emailOutboxService.enqueueDailyReport({ date, to });
        res.json(result);
    } catch (error) {
        console.error("Error triggering report:", error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;
