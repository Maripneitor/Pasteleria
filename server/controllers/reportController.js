const { processDailyCutEmail } = require('../services/dailyCutEmailService');
const auditService = require('../services/auditService');
const { buildTenantWhere } = require('../utils/tenantScope');

exports.sendDailyCut = async (req, res) => {
    try {
        const date = req.body?.date;
        const branches = Array.isArray(req.body?.branches) ? req.body.branches : [];
        const email = req.body?.email; // explicit override or undefined

        // FIX: Use centralized tenant scope
        const tenantWhere = buildTenantWhere(req, { allowQueryTenant: false }); // For email actions, maybe restrict? 
        // Actually processDailyCutEmail takes `tenantFilter`. 
        // We should pass the RESULT of buildTenantWhere as filtering criteria.
        // req.tenantFilter was probably a middleware construct, but now we use the utils.

        const result = await processDailyCutEmail({
            date,
            branches,
            email,
            userId: req.user?.id,
            tenantFilter: tenantWhere // Pass valid where clause
        });

        if (result.skipped) {
            return res.json({ ok: true, message: result.message, skipped: true });
        }

        if (!result.ok) {
            // Return 500 with details for frontend toast
            return res.status(500).json({
                ok: false,
                message: result.message,
                details: result.error || 'Error desconocido'
            });
        }

        // AUDIT
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

        const { Folio } = require('../models');
        const { Op } = require('sequelize');
        const pdfService = require('../services/pdfService');

        // FIX: Use centralized tenant scope
        const tenantWhere = buildTenantWhere(req);

        const folios = await Folio.findAll({
            where: {
                fecha_entrega: targetDate,
                estatus_folio: { [Op.ne]: 'Cancelado' },
                ...tenantWhere // Spread the tenant filter
            },
            order: [['hora_entrega', 'ASC']],
        });

        const pdfBuffer = await pdfService.renderOrdersPdf({
            folios: folios.map(f => f.toJSON()),
            date: targetDate,
            branches: branchList,
        });

        // 2. Asegurar que lo que mandas es Buffer real
        if (!Buffer.isBuffer(pdfBuffer) || pdfBuffer.length < 100) {
            return res.status(500).json({
                message: 'PDF inválido',
                details: 'El servicio de PDF retornó un buffer vacío o corrupto.'
            });
        }

        // 1. Siempre setear headers explícitos
        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `inline; filename="corte-${targetDate}.pdf"`,
            'Content-Length': pdfBuffer.length
        });

        return res.send(pdfBuffer);

    } catch (e) {
        console.error('previewDailyCut:', e);
        // 3. En catch, no mandes HTML default; manda JSON con details
        res.status(500).json({ message: 'Error generando vista previa', details: e.message });
    }
};
