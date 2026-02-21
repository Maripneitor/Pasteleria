const { processDailyCutEmail } = require('../../../services/dailyCutEmailService');
const auditService = require('../../../services/auditService');
const { buildTenantWhere } = require('../../../utils/tenantScope');
const asyncHandler = require('../../core/asyncHandler');

exports.sendDailyCut = asyncHandler(async (req, res) => {
    const date = req.body?.date;
    const branches = Array.isArray(req.body?.branches) ? req.body.branches : [];
    const email = req.body?.email;
    const force = req.body?.force === true;

    const tenantWhere = buildTenantWhere(req, { allowQueryTenant: false });

    const result = await processDailyCutEmail({
        date,
        branches,
        email,
        userId: req.user?.id,
        tenantFilter: tenantWhere,
        force
    });

    if (result.skipped) {
        return res.json({ ok: true, message: result.message, skipped: true });
    }

    if (!result.ok) {
        const err = new Error(result.message || 'Error generando corte');
        err.status = 500;
        err.details = result.error;
        throw err;
    }

    const userId = req.user?.id || 0;
    try {
        auditService.log('SEND_REPORT', 'DAILY_CUT', 0, { date, email }, userId);
    } catch (auditErr) { console.warn('Audit fail:', auditErr.message); }

    return res.json({ ok: true, message: 'Corte guardado y enviado.' });
});

exports.previewDailyCut = asyncHandler(async (req, res) => {
    const { date, branches } = req.query;
    const targetDate = date || new Date().toISOString().split('T')[0];
    const branchList = branches ? branches.split(',') : [];

    const { Folio } = require('../../../models');
    const { Op } = require('sequelize');
    const pdfService = require('../../../services/pdfService');

    const tenantWhere = buildTenantWhere(req);

    const folios = await Folio.findAll({
        where: {
            fecha_entrega: targetDate,
            estatus_folio: { [Op.ne]: 'Cancelado' },
            ...tenantWhere
        },
        order: [['hora_entrega', 'ASC']],
    });

    const pdfBuffer = await pdfService.renderOrdersPdf({
        folios: folios.map(f => f.toJSON()),
        date: targetDate,
        branches: branchList,
    });

    if (!Buffer.isBuffer(pdfBuffer) || pdfBuffer.length < 100) {
        const err = new Error('PDF inválido o corrupto');
        err.status = 500;
        throw err;
    }

    res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="corte-${targetDate}.pdf"`,
        'Content-Length': pdfBuffer.length
    });

    return res.send(pdfBuffer);
});
