const PdfTemplate = require('../../../models/PdfTemplate');
const pdfService = require('../../../services/pdfService');
const { buildTenantWhere } = require('../../../utils/tenantScope');
const asyncHandler = require('../../core/asyncHandler');

// CRUD
exports.listTemplates = asyncHandler(async (req, res) => {
    const where = buildTenantWhere(req);
    const list = await PdfTemplate.findAll({ where });
    res.json(list);
});

exports.createTemplate = asyncHandler(async (req, res) => {
    const payload = { ...req.body, tenantId: req.user?.tenantId || 1 };
    const newItem = await PdfTemplate.create(payload);
    res.status(201).json(newItem);
});

exports.updateTemplate = asyncHandler(async (req, res) => {
    const tenantFilter = buildTenantWhere(req);
    const where = { id: req.params.id, ...tenantFilter };

    const row = await PdfTemplate.findOne({ where });
    if (!row) return res.status(404).json({ message: 'Template not found' });

    await row.update(req.body);
    res.json(row);
});

exports.deleteTemplate = asyncHandler(async (req, res) => {
    const row = await PdfTemplate.findByPk(req.params.id);
    if (!row) return res.status(404).json({ message: 'Template not found' });

    await row.destroy();
    res.json({ message: 'Deleted' });
});

// GET Branding
exports.getMyBranding = asyncHandler(async (req, res) => {
    const ownerId = req.user.ownerId || req.user.id;

    // Find template for this owner
    let template = await PdfTemplate.findOne({ where: { ownerId } });

    // Default structure if none
    if (!template) {
        return res.json({
            businessName: '',
            footerText: '',
            logoUrl: '',
            primaryColor: '#000000'
        });
    }

    res.json(template.configJson || {});
});

// SAVE Branding (Owner Only)
exports.saveMyBranding = asyncHandler(async (req, res) => {
    if (req.user.role !== 'OWNER' && req.user.role !== 'SUPER_ADMIN') {
        return res.status(403).json({ message: 'Solo el dueño puede modificar el branding.' });
    }

    const ownerId = req.user.id;
    const config = req.body;

    let template = await PdfTemplate.findOne({ where: { ownerId } });

    if (template) {
        await template.update({ configJson: config });
    } else {
        await PdfTemplate.create({
            name: 'Branding ' + ownerId,
            ownerId,
            tenantId: req.user.tenantId || 1,
            configJson: config,
            isDefault: true
        });
    }

    res.json({ message: 'Branding actualizado correctmente', config });
});

// PREVIEW
exports.previewTemplate = asyncHandler(async (req, res) => {
    const ownerId = req.user.ownerId || req.user.id;
    const template = await PdfTemplate.findOne({ where: { ownerId } });
    const config = template ? template.configJson : {};

    const folioData = {
        folio_numero: 'PREVIEW-001',
        cliente_nombre: 'Cliente Vista Previa',
        total: 1500,
        fecha_entrega: new Date().toISOString().split('T')[0],
        sabores_pan: ['Chocolate', 'Vainilla'],
        rellenos: ['Fresa'],
        id: 999999
    };

    const buffer = await pdfService.renderFolioPdf({
        folio: folioData,
        watermark: 'VISTA PREVIA',
        templateConfig: config
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.send(buffer);
});
