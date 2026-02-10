const folioService = require('../services/folioService');
const { buildTenantWhere } = require('../utils/tenantScope');

// ✅ LIST
exports.listFolios = async (req, res) => {
    try {
        const tenantFilter = buildTenantWhere(req);
        const data = await folioService.listFolios(req.query, tenantFilter);
        res.json(data);
    } catch (e) {
        console.error('listFolios:', e);
        res.status(500).json({ message: 'Error listando folios' });
    }
};

// ✅ GET ONE
exports.getFolioById = async (req, res) => {
    try {
        const tenantFilter = buildTenantWhere(req);
        const row = await folioService.getFolioById(req.params.id, tenantFilter);
        if (!row) return res.status(404).json({ message: 'Folio no encontrado (o sin acceso)' });
        res.json(row);
    } catch (e) {
        console.error('getFolioById:', e);
        res.status(500).json({ message: 'Error consultando folio' });
    }
};

// ✅ CREATE
exports.createFolio = async (req, res) => {
    try {
        const { normalizeBody } = require('../utils/parseMaybeJson');
        const body = normalizeBody(req.body);

        // Tenant Assignment
        const tenantId = req.user?.tenantId || 1;

        const row = await folioService.createFolio(body, req.user, tenantId);
        res.status(201).json(row);
    } catch (e) {
        console.error(`[CreateFolio] CRITICAL ERROR (Req: ${req.requestId}):`, e);
        const requestId = req.requestId;

        if (e.code === 'VALIDATION_ERROR') {
            return res.status(e.status).json({
                ok: false,
                code: 'VALIDATION_ERROR',
                message: e.message,
                details: e.details,
                requestId
            });
        }

        if (e.name === 'SequelizeValidationError') {
            const errors = e.errors.map(er => `${er.path}: ${er.message}`);
            return res.status(400).json({
                ok: false,
                code: 'VALIDATION_ERROR',
                message: 'Error de validación',
                details: errors,
                requestId
            });
        }

        res.status(500).json({
            ok: false,
            code: 'INTERNAL_ERROR',
            message: 'Error interno creando folio',
            error: e.message,
            requestId
        });
    }
};

// ✅ UPDATE
exports.updateFolio = async (req, res) => {
    try {
        const tenantFilter = buildTenantWhere(req);
        const row = await folioService.updateFolio(req.params.id, req.body, tenantFilter);
        res.json(row);
    } catch (e) {
        console.error('updateFolio:', e);
        const status = e.status || 500;
        res.status(status).json({ message: e.message || 'Error actualizando folio' });
    }
};

// ✅ CANCEL
exports.cancelFolio = async (req, res) => {
    try {
        const tenantFilter = buildTenantWhere(req);
        const result = await folioService.cancelFolio(req.params.id, req.body?.motivo, req.user, tenantFilter);
        res.json({ message: 'Folio cancelado', folio: result });
    } catch (e) {
        console.error('cancelFolio:', e);
        const status = e.status || 500;
        res.status(status).json({ message: e.message || 'Error cancelando folio' });
    }
};

// Status update
exports.updateFolioStatus = async (req, res) => {
    try {
        const tenantFilter = buildTenantWhere(req);
        const row = await folioService.updateFolioStatus(req.params.id, req.body.status, tenantFilter);
        res.json(row);
    } catch (e) {
        console.error("updateStatus:", e);
        const status = e.status || 500;
        res.status(status).json({ message: e.message || 'Error' });
    }
};

// ✅ DELETE
exports.deleteFolio = async (req, res) => {
    try {
        const tenantFilter = buildTenantWhere(req);
        await folioService.deleteFolio(req.params.id, req.user, tenantFilter);
        res.json({ message: 'Eliminado' });
    } catch (e) {
        console.error('deleteFolio:', e);
        const status = e.status || 500;
        res.status(status).json({ message: e.message || 'Error eliminando folio' });
    }
};

// ✅ CALENDAR
exports.getCalendarEvents = async (req, res) => {
    try {
        const tenantFilter = buildTenantWhere(req);
        const events = await folioService.getCalendarEvents(req.query.start, req.query.end, tenantFilter);
        res.json(events);
    } catch (e) {
        console.error('getCalendarEvents:', e);
        res.status(500).json({ message: 'Error calendario' });
    }
};

// ✅ DASHBOARD
exports.getDashboardStats = async (req, res) => {
    try {
        const tenantFilter = buildTenantWhere(req);
        const stats = await folioService.getDashboardStats(tenantFilter);
        res.json(stats);
    } catch (e) {
        console.error('getDashboardStats Error (Recovered):', e);
        // Fallback response to prevent UI Crash
        res.json({
            metrics: {
                totalOrders: 0,
                pendingOrders: 0,
                todayOrders: 0,
                totalSales: 0,
                totalAdvance: 0
            },
            recientes: [],
            populares: []
        });
    }
};

// ✅ PDF and others
exports.generarPDF = async (req, res) => {
    try {
        const tenantFilter = buildTenantWhere(req);
        const { buffer, filename } = await folioService.generateFolioPdf(req.params.id, tenantFilter, req.user);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
        res.setHeader('Content-Length', buffer.length);
        res.send(buffer);
    } catch (e) {
        console.error('generarPDF:', e);
        const status = e.status || 500;
        res.status(status).json({ message: 'Error generando PDF', details: e.message });
    }
};

exports.generarEtiqueta = async (req, res) => {
    try {
        const tenantFilter = buildTenantWhere(req);
        const { buffer, filename } = await folioService.generateLabelPdf(req.params.id, tenantFilter);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
        res.send(buffer);
    } catch (e) {
        const status = e.status || 500;
        res.status(status).json({ message: 'Error Etiqueta' });
    }
};

// ✅ DAY SUMMARY (Comandas & Labels)
exports.getDaySummary = async (req, res) => {
    try {
        const tenantFilter = buildTenantWhere(req);
        const date = req.query.date || req.query.fecha;

        // Helper to generate file URL (assuming static serve or generic file endpoint)
        // Ideally returns download links
        // We will return data structure with links to the new PDF endpoints

        // Verify if date has data?
        // Service's generateDaySummaryPdfs returns buffers. We might want to stream one of them or return JSON with availability.
        // But prompt implies one endpoint for JSON summary? 
        // "GET /api/folios/resumen-dia" -> JSON { comandasUrl: '...', etiquetasUrl: '...' }
        const baseUrl = process.env.API_URL || 'http://localhost:3000/api';

        res.json({
            date,
            comandasUrl: `${baseUrl}/folios/pdf/comandas/${date}`,
            etiquetasUrl: `${baseUrl}/folios/pdf/etiquetas/${date}`
        });

    } catch (e) {
        console.error('getDaySummary:', e);
        res.status(500).json({ message: 'Error getting summary' });
    }
};

exports.downloadComandasPdf = async (req, res) => {
    try {
        const tenantFilter = buildTenantWhere(req);
        const { comandasBuffer } = await folioService.generateDaySummaryPdfs(req.params.date, tenantFilter);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="comandas-${req.params.date}.pdf"`);
        res.send(comandasBuffer);
    } catch (e) {
        console.error('downloadComandasPdf:', e);
        res.status(500).json({ message: 'Error generating PDF' });
    }
};

exports.downloadEtiquetasPdf = async (req, res) => {
    try {
        const tenantFilter = buildTenantWhere(req);
        const { etiquetasBuffer } = await folioService.generateDaySummaryPdfs(req.params.date, tenantFilter);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="etiquetas-${req.params.date}.pdf"`);
        res.send(etiquetasBuffer);
    } catch (e) {
        console.error('downloadEtiquetasPdf:', e);
        res.status(500).json({ message: 'Error generating PDF' });
    }
};

exports.generarResumenDia = exports.getDaySummary; // Alias for legacy route if any