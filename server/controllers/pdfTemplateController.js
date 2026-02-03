const PdfTemplate = require('../models/PdfTemplate');
const pdfService = require('../services/pdfService');
const { buildTenantWhere } = require('../utils/tenantScope');

// CRUD
exports.listTemplates = async (req, res) => {
    try {
        const where = buildTenantWhere(req);
        const list = await PdfTemplate.findAll({ where });
        res.json(list);
    } catch (e) {
        console.error('ListTemplates:', e);
        res.status(500).json({ message: 'Error listing templates' });
    }
};

exports.createTemplate = async (req, res) => {
    try {
        const payload = { ...req.body, tenantId: req.user?.tenantId || 1 };
        const newItem = await PdfTemplate.create(payload);
        res.status(201).json(newItem);
    } catch (e) {
        console.error('CreateTemplate:', e);
        res.status(500).json({ message: 'Error creating template' });
    }
};

exports.updateTemplate = async (req, res) => {
    try {
        const row = await PdfTemplate.findByPk(req.params.id);
        if (!row) return res.status(404).json({ message: 'Template not found' });

        await row.update(req.body);
        res.json(row);
    } catch (e) {
        console.error('UpdateTemplate:', e);
        res.status(500).json({ message: 'Error updating template' });
    }
};

exports.deleteTemplate = async (req, res) => {
    try {
        const row = await PdfTemplate.findByPk(req.params.id);
        if (!row) return res.status(404).json({ message: 'Template not found' });

        await row.destroy();
        res.json({ message: 'Deleted' });
    } catch (e) {
        console.error('DeleteTemplate:', e);
        res.status(500).json({ message: 'Error deleting template' });
    }
};

// PREVIEW
exports.previewTemplate = async (req, res) => {
    try {
        const templateId = req.params.id;
        const folioId = req.query.folioId;

        const template = await PdfTemplate.findByPk(templateId);
        if (!template) return res.status(404).json({ message: 'Template not found' });

        // Mock folio or fetch real one
        let folioData = {
            folio_numero: 'PREVIEW-001',
            cliente_nombre: 'Cliente Vista Previa',
            total: 1500,
            fecha_entrega: '2023-12-31',
            // ... more mock data
        };

        if (folioId) {
            const Folio = require('../models/Folio');
            const realFolio = await Folio.findByPk(folioId);
            if (realFolio) folioData = realFolio.toJSON();
        }

        // Pass template config as options to renderFolioPdf
        // Note: We assume renderFolioPdf can handle a second options arg or we patch it later.
        // For now, we pass it to see if it breaks.
        const buffer = await pdfService.renderFolioPdf({
            folio: folioData,
            watermark: 'VISTA PREVIA',
            templateConfig: template.configJson // Injecting config
        });

        res.setHeader('Content-Type', 'application/pdf');
        res.send(buffer);

    } catch (e) {
        console.error('PreviewTemplate:', e);
        res.status(500).json({ message: 'Error previewing template' });
    }
};
