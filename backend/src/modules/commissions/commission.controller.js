const commissionService = require('../../../services/commissionService');
const emailOutboxService = require('../../../services/emailOutboxService');
const pdfService = require('../../../services/pdfService');
const { sendReportEmail } = require('../../../services/dailyCutEmailService');
const asyncHandler = require('../../core/asyncHandler');

// GET /api/v1/commissions/report?from=YYYY-MM-DD&to=YYYY-MM-DD
exports.getReport = asyncHandler(async (req, res) => {
    const { from, to } = req.query;
    if (!from || !to) {
        return res.status(400).json({ error: 'Parameters "from" and "to" are required.' });
    }

    const report = await commissionService.getReport({ from, to });
    res.json(report);
});

// GET /api/v1/commissions/report/pdf?from=YYYY-MM-DD&to=YYYY-MM-DD
exports.getReportPdf = asyncHandler(async (req, res) => {
    const { from, to } = req.query;
    if (!from || !to) {
        return res.status(400).json({ error: 'Parameters "from" and "to" are required.' });
    }

    const report = await commissionService.getReport({ from, to });

    const buffer = await pdfService.renderCommissionsPdf({
        reportData: report.details,
        from,
        to
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="comisiones_${from}_${to}.pdf"`);
    res.setHeader('Content-Length', buffer.length);
    res.send(buffer);
});

// POST /api/v1/commissions/record
exports.recordCommission = asyncHandler(async (req, res) => {
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
});

// POST /api/v1/commissions/trigger-report (For Testing Outbox)
exports.triggerReport = asyncHandler(async (req, res) => {
    const { date, to } = req.body;
    if (!date || !to) {
        return res.status(400).json({ error: 'date and to (email) are required' });
    }

    const result = await emailOutboxService.enqueueDailyReport({ date, to });
    res.json(result);
});

// POST /api/v1/commissions/report/email
exports.sendReportEmail = asyncHandler(async (req, res) => {
    const { from, to } = req.body;
    if (!from || !to) {
        return res.status(400).json({ error: 'Parameters "from" and "to" are required.' });
    }

    const report = await commissionService.getReport({ from, to });

    const buffer = await pdfService.renderCommissionsPdf({
        reportData: report.details,
        from,
        to
    });

    const dateRange = `${from} al ${to}`;
    const result = await sendReportEmail({
        subject: `Reporte de Comisiones (${dateRange})`,
        text: `Adjunto encontrarás el reporte de comisiones del periodo ${dateRange}.\n\nGenerado por: ${req.user?.name || 'Admin'}`,
        filename: `Comisiones_${from}_${to}.pdf`,
        content: buffer,
    });

    res.json({ message: 'Correo enviado', details: result });
});
