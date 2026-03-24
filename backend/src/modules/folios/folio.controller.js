const folioService = require('./folio.service');
const { buildTenantWhere } = require('../../../utils/tenantScope');
const asyncHandler = require('../../core/asyncHandler');
const { generateComandaPdf, generateNotaVentaPdf } = require('../../../services/pdfService'); // Temp

// ✅ LIST
exports.listFolios = asyncHandler(async (req, res) => {
    const tenantFilter = buildTenantWhere(req);
    const data = await folioService.listFolios(req.query, tenantFilter);
    res.json(data);
});

// ✅ GET ONE
exports.getFolioById = asyncHandler(async (req, res) => {
    // TRAMPA 1: Ver qué ID está recibiendo realmente
    console.log("🔍 FRONTEND PIDIENDO EL FOLIO ID:", req.params.id); 
    
    const tenantFilter = buildTenantWhere(req);
    // TRAMPA 2: Ver los filtros de seguridad
    console.log("🔐 Filtros aplicados:", tenantFilter); 
    
    const row = await folioService.getFolioById(req.params.id, tenantFilter);
    
    if (!row) {
        // TRAMPA 3: Ver si la base de datos lo rechazó
        console.log("❌ ERROR: La base de datos devolvió NULL para el ID:", req.params.id); 
        return res.status(404).json({ message: 'Folio no encontrado (o sin acceso)' });
    }
    
    console.log("✅ FOLIO ENCONTRADO Y ENVIADO AL FRONTEND");
    res.json(row);
});

// ✅ CREATE
exports.createFolio = asyncHandler(async (req, res) => {
    const { normalizeBody } = require('../../../utils/parseMaybeJson');
    const body = normalizeBody(req.body);
    const tenantId = req.user?.tenantId || 1;

    // 🌟 INICIO: Asociar las imágenes subidas al pedido
    const baseUrl = (process.env.API_URL || 'http://localhost:3000/api/v1').replace('/api/v1', '');
    
    if (!body.diseno_metadata) body.diseno_metadata = {};
    
    if (req.files && req.files.length > 0) {
        // Generar URLs completas para que el frontend las lea directo
        const imageUrls = req.files.map(file => `${baseUrl}/uploads/${file.filename}`);
        
        body.diseno_metadata.allImages = imageUrls;
        body.imagen_referencia_url = imageUrls[0]; // Usamos la primera como imagen principal
    } else {
        body.diseno_metadata.allImages = [];
    }
    // 🌟 FIN: Corrección de imágenes

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
        const body = req.body;

        // 🌟 INICIO: Asociar las imágenes en edición
        const baseUrl = (process.env.API_URL || 'http://localhost:3000/api/v1').replace('/api/v1', '');
        
        if (!body.diseno_metadata) body.diseno_metadata = {};
        let finalImages = [];
        
        // 1. Conservar las imágenes que ya existían (URLs pasadas)
        if (body.existingImages) {
            finalImages = Array.isArray(body.existingImages) ? body.existingImages : [body.existingImages];
        }

        // 2. Agregar las nuevas imágenes recién subidas
        if (req.files && req.files.length > 0) {
            const newImages = req.files.map(file => `${baseUrl}/uploads/${file.filename}`);
            finalImages = [...finalImages, ...newImages];
        }

        body.diseno_metadata.allImages = finalImages;
        if (finalImages.length > 0) {
            body.imagen_referencia_url = finalImages[0];
        }
        // 🌟 FIN: Corrección de imágenes

        // Pass userId so the audit log knows WHO made the change
        const row = await folioService.updateFolio(req.params.id, body, tenantFilter, t, req.user?.id);
        await t.commit();
        res.json(row);
    } catch (error) {
        await t.rollback();
        throw error;
    }
});

// ✅ CANCEL
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

// Status update
exports.updateFolioStatus = asyncHandler(async (req, res) => {
    const tenantFilter = buildTenantWhere(req);
    const row = await folioService.updateFolioStatus(req.params.id, req.body.status, tenantFilter);
    res.json(row);
});

// ✅ DELETE
exports.deleteFolio = asyncHandler(async (req, res) => {
    const tenantFilter = buildTenantWhere(req);
    await folioService.deleteFolio(req.params.id, req.user, tenantFilter);
    res.json({ message: 'Eliminado' });
});

// ✅ CALENDAR
exports.getCalendarEvents = asyncHandler(async (req, res) => {
    const tenantFilter = buildTenantWhere(req);
    const events = await folioService.getCalendarEvents(req.query.start, req.query.end, tenantFilter);
    res.json(events);
});

// ✅ DASHBOARD STATS
exports.getDashboardStats = asyncHandler(async (req, res) => {
    const tenantFilter = buildTenantWhere(req);
    const stats = await folioService.getDashboardStats(tenantFilter);
    res.json(stats);
});

// ✅ PDF Single
exports.generarPDF = asyncHandler(async (req, res) => {
    const tenantFilter = buildTenantWhere(req);
    const { buffer, filename } = await folioService.generateFolioPdf(req.params.id, tenantFilter, req.user);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Length', buffer.length);
    // Cambiamos 'inline' por 'attachment'
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
});

// ✅ PDF Labels (Individual)
exports.generarEtiqueta = asyncHandler(async (req, res) => {
    const tenantFilter = buildTenantWhere(req);
    const { buffer, filename } = await folioService.generateLabelPdf(req.params.id, tenantFilter);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    res.send(buffer);
});

// ✅ PDF DAY SUMMARY (Comandas & Labels)
exports.getDaySummary = asyncHandler(async (req, res) => {
    const date = req.query.date || req.query.fecha;
    const baseUrl = process.env.API_URL || 'http://localhost:3000/api/v1'; // Update to v1
    res.json({
        date,
        comandasUrl: `${baseUrl}/folios/pdf/comandas/${date}`,
        etiquetasUrl: `${baseUrl}/folios/pdf/etiquetas/${date}`
    });
});

exports.downloadComandasPdf = asyncHandler(async (req, res) => {
    const tenantFilter = buildTenantWhere(req);
    // Obtenemos el buffer del servicio
    const { comandasBuffer } = await folioService.generateDaySummaryPdfs(req.params.date, tenantFilter);
    
    // Configuramos headers de descarga
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Resumen-${req.params.date}.pdf"`);
    
    // Enviamos el buffer directamente
    res.end(comandasBuffer); 
});

exports.downloadEtiquetasPdf = asyncHandler(async (req, res) => {
    const tenantFilter = buildTenantWhere(req);
    const { etiquetasBuffer } = await folioService.generateDaySummaryPdfs(req.params.date, tenantFilter);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="etiquetas-${req.params.date}.pdf"`);
    res.send(etiquetasBuffer);
});

// Modern PDF Endpoints (Merged from folioPdfController)
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
