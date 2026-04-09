const folioService = require('./folio.service');
const { buildTenantWhere } = require('../../../utils/tenantScope');
const asyncHandler = require('../../core/asyncHandler');
const { generateComandaPdf, generateNotaVentaPdf } = require('../../../services/pdfService');

// ✅ LIST
exports.listFolios = asyncHandler(async (req, res) => {
    const tenantFilter = buildTenantWhere(req);
    const data = await folioService.listFolios(req.query, tenantFilter);
    res.json(data);
});

// ✅ GET ONE
exports.getFolioById = asyncHandler(async (req, res) => {
    const tenantFilter = buildTenantWhere(req);
    const row = await folioService.getFolioById(req.params.id, tenantFilter);
    
    if (!row) {
        return res.status(404).json({ message: 'Folio no encontrado (o sin acceso)' });
    }
    
    // 🔥 BLINDAJE DE LECTURA: Interceptamos el JSON antes de mandarlo al Frontend
    // Si Sequelize borró la columna raíz, la rescatamos del JSON diseno_metadata
    const folioJson = row.toJSON();
    const isExtra = 
        folioJson.diseno_metadata?.extraHeight === true || 
        folioJson.diseno_metadata?.altura_extra === 'Sí' ||
        folioJson.altura_extra === 'Sí' || 
        folioJson.extraHeight === true ||
        String(folioJson.extraHeight) === 'true';

    folioJson.extraHeight = isExtra;
    folioJson.altura_extra = isExtra ? 'Sí' : 'No';

    res.json(folioJson);
});

// ✅ CREATE
exports.createFolio = asyncHandler(async (req, res) => {
    const { normalizeBody } = require('../../../utils/parseMaybeJson');
    const body = normalizeBody(req.body);
    const tenantId = req.user?.tenantId || 1;

    const baseUrl = (process.env.API_URL || 'http://localhost:3000/api/v1').replace('/api/v1', '');
    
    // 🔥 RESCATE DEL BOOLEANO DESDE EL FORM DATA
    const isExtra = body.extraHeight === 'true' || body.extraHeight === true || body.altura_extra === 'Sí';

    if (!body.diseno_metadata) body.diseno_metadata = {};
    let finalImages = [];

    if (body.diseno_metadata?.allImages && body.diseno_metadata.allImages.length > 0) {
        finalImages = Array.isArray(body.diseno_metadata.allImages) ? body.diseno_metadata.allImages : [body.diseno_metadata.allImages];
    } else if (body.referenceImages) {
        finalImages = Array.isArray(body.referenceImages) ? body.referenceImages : [body.referenceImages];
    } else if (body.existingImages) {
        finalImages = Array.isArray(body.existingImages) ? body.existingImages : [body.existingImages];
    }
    
    if (req.files && req.files.length > 0) {
        const imageUrls = req.files.map(file => `${baseUrl}/uploads/${file.filename}`);
        finalImages = [...finalImages, ...imageUrls];
    }

    body.diseno_metadata.allImages = finalImages;
    body.diseno_metadata.extraHeight = isExtra; // 🔥 Lo incrustamos en el JSON seguro

    if (finalImages.length > 0) body.imagen_referencia_url = finalImages[0];

    const { sequelize } = require('../../../models');
    const t = await sequelize.transaction();

    try {
        const row = await folioService.createFolio(body, req.user, tenantId, t);
        await t.commit();
        res.status(201).json(row);
    } catch (error) {
        await t.rollback();
        throw error;
    }
});

// ✅ UPDATE
exports.updateFolio = asyncHandler(async (req, res) => {
    const { sequelize } = require('../../../models');
    const t = await sequelize.transaction();
    try {
        const tenantFilter = buildTenantWhere(req);
        const { normalizeBody } = require('../../../utils/parseMaybeJson');
        const body = normalizeBody(req.body); 
        
        const baseUrl = (process.env.API_URL || 'http://localhost:3000/api/v1').replace('/api/v1', '');
        
        // 🔥 RESCATE DEL BOOLEANO EN EDICIÓN
        const isExtra = body.extraHeight === 'true' || body.extraHeight === true || body.altura_extra === 'Sí';
        
        if (!body.diseno_metadata) body.diseno_metadata = {};
        let finalImages = [];
        
        if (body.existingImages) {
            finalImages = Array.isArray(body.existingImages) ? body.existingImages : [body.existingImages];
        } else if (body.diseno_metadata?.allImages && body.diseno_metadata.allImages.length > 0) {
            finalImages = Array.isArray(body.diseno_metadata.allImages) ? body.diseno_metadata.allImages : [body.diseno_metadata.allImages];
        }

        if (req.files && req.files.length > 0) {
            const newImages = req.files.map(file => `${baseUrl}/uploads/${file.filename}`);
            finalImages = [...finalImages, ...newImages];
        }

        body.diseno_metadata.allImages = finalImages;
        body.diseno_metadata.extraHeight = isExtra; // 🔥 Lo incrustamos en el JSON seguro

        if (finalImages.length > 0) body.imagen_referencia_url = finalImages[0];

        const row = await folioService.updateFolio(req.params.id, body, tenantFilter, t, req.user?.id);
        await t.commit();
        
        const folioJson = row.toJSON();
        folioJson.extraHeight = isExtra; // Forzamos retorno inmediato para React
        res.json(folioJson);
    } catch (error) {
        await t.rollback();
        throw error;
    }
});

// ✅ RESTO DE CONTROLADORES SIN CAMBIOS (Mismos de tu versión anterior)
exports.cancelFolio = asyncHandler(async (req, res) => {
    const { sequelize } = require('../../../models');
    const t = await sequelize.transaction();
    try {
        const tenantFilter = buildTenantWhere(req);
        const result = await folioService.cancelFolio(req.params.id, req.body?.motivo, req.user, tenantFilter, t);
        await t.commit();
        res.json({ message: 'Folio cancelado', folio: result });
    } catch (error) {
        await t.rollback();
        throw error;
    }
});

exports.updateFolioStatus = asyncHandler(async (req, res) => {
    const tenantFilter = buildTenantWhere(req);
    const row = await folioService.updateFolioStatus(req.params.id, req.body.status, tenantFilter);
    res.json(row);
});

exports.deleteFolio = asyncHandler(async (req, res) => {
    const tenantFilter = buildTenantWhere(req);
    await folioService.deleteFolio(req.params.id, req.user, tenantFilter);
    res.json({ message: 'Eliminado' });
});

exports.getCalendarEvents = asyncHandler(async (req, res) => {
    const tenantFilter = buildTenantWhere(req);
    const events = await folioService.getCalendarEvents(req.query.start, req.query.end, tenantFilter);
    res.json(events);
});

exports.getDashboardStats = asyncHandler(async (req, res) => {
    const tenantFilter = buildTenantWhere(req);
    const stats = await folioService.getDashboardStats(tenantFilter);
    res.json(stats);
});

exports.getFolioAudits = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const AuditLog = require('../../../models/AuditLog');
    const User = require('../../../models/user');
    const logs = await AuditLog.findAll({
        where: { entity: 'FOLIO', entityId: id },
        order: [['createdAt', 'DESC']],
        include: [{ model: User, as: 'actor', attributes: ['name', 'email'] }]
    });
    const result = logs.map((log) => {
        const j = log.toJSON();
        j.details = j.meta; 
        return j;
    });
    res.json(result);
});

exports.generarPDF = asyncHandler(async (req, res) => {
    const tenantFilter = buildTenantWhere(req);
    const { buffer, filename } = await folioService.generateFolioPdf(req.params.id, tenantFilter, req.user);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Length', buffer.length);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
});

exports.generarEtiqueta = asyncHandler(async (req, res) => {
    const tenantFilter = buildTenantWhere(req);
    const { buffer, filename } = await folioService.generateLabelPdf(req.params.id, tenantFilter);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    res.send(buffer);
});

exports.getDaySummary = asyncHandler(async (req, res) => {
    const date = req.query.date || req.query.fecha;
    const baseUrl = process.env.API_URL || 'http://localhost:3000/api/v1'; 
    res.json({
        date,
        comandasUrl: `${baseUrl}/folios/pdf/comandas/${date}`,
        etiquetasUrl: `${baseUrl}/folios/pdf/etiquetas/${date}`
    });
});

exports.downloadComandasPdf = asyncHandler(async (req, res) => {
    const tenantFilter = buildTenantWhere(req);
    const { comandasBuffer } = await folioService.generateDaySummaryPdfs(req.params.date, tenantFilter);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Resumen-${req.params.date}.pdf"`);
    res.end(comandasBuffer); 
});

exports.downloadEtiquetasPdf = asyncHandler(async (req, res) => {
    const tenantFilter = buildTenantWhere(req);
    const { etiquetasBuffer } = await folioService.generateDaySummaryPdfs(req.params.date, tenantFilter);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="etiquetas-${req.params.date}.pdf"`);
    res.send(etiquetasBuffer);
});

exports.getFolioComandaPdf = asyncHandler(async (req, res) => {
    const folioId = req.params.id;
    const ctx = { tenantId: req.user.tenantId, branchId: req.user.branchId, role: req.user.role, userId: req.user.id };
    const pdfBuffer = await generateComandaPdf(folioId, ctx);
    const download = String(req.query.download).toLowerCase() === 'true';
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `${download ? 'attachment' : 'inline'}; filename="comanda_folio-${folioId}.pdf"`);
    res.send(pdfBuffer);
});

exports.getFolioNotaPdf = asyncHandler(async (req, res) => {
    const folioId = req.params.id;
    const ctx = { tenantId: req.user.tenantId, branchId: req.user.branchId, role: req.user.role, userId: req.user.id };
    const pdfBuffer = await generateNotaVentaPdf(folioId, ctx);
    const download = String(req.query.download).toLowerCase() === 'true';
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `${download ? 'attachment' : 'inline'}; filename="nota_folio-${folioId}.pdf"`);
    res.send(pdfBuffer);
});