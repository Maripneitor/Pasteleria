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
// MOCK PREVIEW REMOVED OR KEPT AS LEGACY? 
// Replaced with specific Branding Logic

// GET Branding (For Admin/Owner to view)
exports.getMyBranding = async (req, res) => {
    try {
        const ownerId = req.user.ownerId || req.user.id; // If I am owner, my Id. If employee, my boss.

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
    } catch (e) {
        console.error('getBranding:', e);
        res.status(500).json({ message: 'Error retrieving branding' });
    }
};

// SAVE Branding (Owner Only)
exports.saveMyBranding = async (req, res) => {
    try {
        // Strict Check: Only OWNER (or Super Admin masquerading) can write
        // "ADMIN" role is usually an Employee with powers, but USER REQUEST says:
        // "Admin puede ver... pero NO modificarlo (a menos que se autorice explícitamente)"
        // Since we don't have explicit auth toggle, strict to OWNER role or ownerId=null (which implies Owner)

        // However, effective role logic:
        // If req.user.role === 'OWNER' -> OK.
        // If req.user.role === 'ADMIN' -> REJECT? Request says "Solo OWNER... puede modificar".

        if (req.user.role !== 'OWNER' && req.user.role !== 'SUPER_ADMIN') {
            return res.status(403).json({ message: 'Solo el dueño puede modificar el branding.' });
        }

        const ownerId = req.user.id; // I am the owner
        const config = req.body; // { logoUrl, businessName, etc }

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

    } catch (e) {
        console.error('saveBranding:', e);
        res.status(500).json({ message: 'Error saving branding' });
    }
};

// PREVIEW (Updated to use branding)
exports.previewTemplate = async (req, res) => {
    try {
        // Use current user's branding context
        const ownerId = req.user.ownerId || req.user.id;
        const template = await PdfTemplate.findOne({ where: { ownerId } });
        const config = template ? template.configJson : {};

        // Mock folio
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

    } catch (e) {
        console.error('PreviewTemplate:', e);
        res.status(500).json({ message: 'Error previewing template' });
    }
};
