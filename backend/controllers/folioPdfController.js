const { generateComandaPdf, generateNotaVentaPdf } = require('../services/pdfService');

exports.getFolioComandaPdf = async (req, res, next) => {
    try {
        const folioId = req.params.id;

        // Basic ID Validation
        if (!/^\d+$/.test(folioId)) {
            return res.status(400).json({ message: 'Invalid ID format' });
        }

        // Build Context from authorized user
        const ctx = {
            tenantId: req.user.tenantId,
            branchId: req.user.branchId,
            role: req.user.role,
            userId: req.user.id
        };

        const pdfBuffer = await generateComandaPdf(folioId, ctx);

        const download = String(req.query.download).toLowerCase() === 'true';
        const dispositionType = download ? 'attachment' : 'inline';
        const filename = `comanda_folio-${folioId}.pdf`;

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `${dispositionType}; filename="${filename}"`);
        res.setHeader('Content-Length', pdfBuffer.length);

        return res.status(200).send(pdfBuffer);

    } catch (e) {
        console.error(`[PDF Comanda] Error req=${req.requestId}:`, e);
        const status = e.status || 500;
        const message = e.message || 'Error generating Comanda PDF';

        // If headers sent, we can't send JSON, just close
        if (res.headersSent) {
            return res.end();
        }
        res.status(status).json({ message });
    }
};

exports.getFolioNotaPdf = async (req, res, next) => {
    try {
        const folioId = req.params.id;

        if (!/^\d+$/.test(folioId)) {
            return res.status(400).json({ message: 'Invalid ID format' });
        }

        const ctx = {
            tenantId: req.user.tenantId,
            branchId: req.user.branchId,
            role: req.user.role,
            userId: req.user.id
        };

        const pdfBuffer = await generateNotaVentaPdf(folioId, ctx);

        const download = String(req.query.download).toLowerCase() === 'true';
        const dispositionType = download ? 'attachment' : 'inline';
        const filename = `nota_folio-${folioId}.pdf`;

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `${dispositionType}; filename="${filename}"`);
        res.setHeader('Content-Length', pdfBuffer.length);

        return res.status(200).send(pdfBuffer);

    } catch (e) {
        console.error(`[PDF Nota] Error req=${req.requestId}:`, e);
        const status = e.status || 500;
        const message = e.message || 'Error generating Nota PDF';

        if (res.headersSent) return res.end();
        res.status(status).json({ message });
    }
};
