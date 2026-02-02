const { processDailyCutEmail } = require('../services/dailyCutEmailService');
const auditService = require('../services/auditService');

exports.sendDailyCut = async (req, res) => {
    try {
        const date = req.body?.date;
        const branches = Array.isArray(req.body?.branches) ? req.body.branches : [];
        const email = req.body?.email; // explicit override or undefined

        const result = await processDailyCutEmail({
            date,
            branches,
            email,
            userId: req.user?.id
        });

        if (result.skipped) {
            return res.json({ ok: true, message: result.message, skipped: true });
        }

        if (!result.ok) {
            // Return 500 with details for frontend toast
            return res.status(500).json({
                ok: false,
                message: result.message,
                details: result.error
            });
        }

        // AUDIT (Async) via processDailyCutEmail logic? 
        // Actually processDailyCutEmail handles the "business logic". 
        // We can log the "trigger" here.
        auditService.log('SEND_REPORT', 'DAILY_CUT', 0, { date, email }, req.user?.id);

        return res.json({ ok: true, message: 'Corte guardado y enviado.' });

    } catch (e) {
        console.error('dailyCut:', e);
        return res.status(500).json({ message: 'Error generando corte', error: e.message });
    }
};

exports.previewDailyCut = async (req, res) => {
    try {
        const { date, branches } = req.query;
        const targetDate = date || new Date().toISOString().split('T')[0];
        const branchList = branches ? branches.split(',') : [];

        // Reusing logic from dailyCutEmailService (but lighter)
        const { Folio } = require('../models');
        const { Op } = require('sequelize');
        const pdfService = require('../services/pdfService');

        const folios = await Folio.findAll({
            where: { fecha_entrega: targetDate, estatus_folio: { [Op.ne]: 'Cancelado' } },
            order: [['hora_entrega', 'ASC']],
        });

        const pdfBuffer = await pdfService.renderOrdersPdf({
            folios: folios.map(f => f.toJSON()),
            date: targetDate,
            branches: branchList,
        });

        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `inline; filename="corte-${targetDate}.pdf"`,
            'Content-Length': pdfBuffer.length
        });
        res.send(pdfBuffer);

    } catch (e) {
        console.error('previewDailyCut:', e);
        res.status(500).json({ message: 'Error generando vista previa', error: e.message });
    }
};
