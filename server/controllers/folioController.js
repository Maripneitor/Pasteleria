const { Op } = require('sequelize');
const Folio = require('../models/Folio');
const pdfService = require('../services/pdfService');
const commissionService = require('../services/commissionService');
const auditService = require('../services/auditService');
const { buildTenantWhere } = require('../utils/tenantScope');

// Genera folio_numero secuencial simple
async function nextFolioNumero() {
    const last = await Folio.findOne({ order: [['id', 'DESC']] });
    const next = (last?.id || 0) + 1;
    return `FOL-${String(next).padStart(6, '0')}`;
}

function computeWatermark(folio) {
    if (folio.estatus_folio === 'Cancelado') return 'CANCELADO';
    if (folio.estatus_pago === 'Pagado') return 'PAGADO';
    return 'PENDIENTE';
}

// Helper for Scoped Lookup
async function findScoped(req, id) {
    const where = buildTenantWhere(req);
    return Folio.findOne({
        where: { id, ...where }
    });
}

// ✅ LIST
exports.listFolios = async (req, res) => {
    try {
        const q = (req.query.q || '').trim();
        const tenantFilter = buildTenantWhere(req);

        const where = { ...tenantFilter };

        if (q) {
            where[Op.and] = [
                tenantFilter, // Ensure tenant filter logic is preserved
                {
                    [Op.or]: [
                        { folio_numero: { [Op.like]: `%${q}%` } },
                        { cliente_nombre: { [Op.like]: `%${q}%` } },
                        { cliente_telefono: { [Op.like]: `%${q}%` } },
                    ]
                }
            ];
        }

        const rows = await Folio.findAll({
            where,
            order: [['createdAt', 'DESC']],
        });

        res.json(rows);
    } catch (e) {
        console.error('listFolios:', e);
        res.status(500).json({ message: 'Error listando folios' });
    }
};

// ✅ GET ONE
exports.getFolioById = async (req, res) => {
    try {
        const row = await findScoped(req, req.params.id);
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
        const files = req.files || [];

        const { clientId = null, ...folioData } = body;

        const requestId = req.requestId; // Grab from middleware

        // Validations
        if (!folioData.cliente_nombre || !folioData.cliente_telefono) {
            return res.status(400).json({
                ok: false,
                code: 'VALIDATION_ERROR',
                message: 'Datos incompletos',
                details: ['Falta: cliente_nombre y/o cliente_telefono'],
                requestId
            });
        }

        const required = ['fecha_entrega', 'hora_entrega'];
        for (const k of required) {
            if (!folioData[k]) return res.status(400).json({
                ok: false,
                code: 'VALIDATION_ERROR',
                message: 'Datos incompletos',
                details: [`Falta campo requerido: ${k}`],
                requestId
            });
        }

        const safeNum = (v) => {
            const n = parseFloat(String(v || 0).replace(/[^0-9.-]/g, ''));
            return isNaN(n) ? 0 : n;
        };

        const folioNumero = folioData.folio_numero || await nextFolioNumero();

        const costo_base = safeNum(folioData.costo_base);
        const costo_envio = safeNum(folioData.costo_envio);
        const anticipo = safeNum(folioData.anticipo);
        const total = folioData.total ? safeNum(folioData.total) : (costo_base + costo_envio);

        const estatus_pago = (folioData.estatus_pago) || (total - anticipo <= 0.01 ? 'Pagado' : 'Pendiente');

        // Tenant Assignment
        const tenantId = req.user?.tenantId || 1;

        // Resolving IDs to Names (Source of Truth: IDs)
        let resolvedSabores = Array.isArray(folioData.sabores_pan) ? folioData.sabores_pan : [];
        let resolvedRellenos = Array.isArray(folioData.rellenos) ? folioData.rellenos : [];
        const flavorIds = Array.isArray(folioData.flavorIds) ? folioData.flavorIds : [];
        const fillingIds = Array.isArray(folioData.fillingIds) ? folioData.fillingIds : [];

        if (flavorIds.length > 0) {
            const CakeFlavor = require('../models/CakeFlavor');
            const flavors = await CakeFlavor.findAll({
                where: {
                    id: flavorIds,
                    tenantId: tenantId
                }
            });
            resolvedSabores = flavors.map(f => f.name);
        }

        if (fillingIds.length > 0) {
            const Filling = require('../models/Filling');
            const fillings = await Filling.findAll({
                where: {
                    id: fillingIds,
                    tenantId: tenantId
                }
            });
            resolvedRellenos = fillings.map(f => f.name);
        }

        // Update Metadata with IDs and Resolves Names
        if (typeof folioData.diseno_metadata !== 'object') folioData.diseno_metadata = {};
        folioData.diseno_metadata.flavorIds = flavorIds;
        folioData.diseno_metadata.fillingIds = fillingIds;

        const row = await Folio.create({
            ...folioData,
            folio_numero: folioNumero,
            clientId: clientId || null,
            responsibleUserId: req.user?.id || null,
            tenantId: tenantId,

            cliente_nombre: String(folioData.cliente_nombre || '').trim(),
            cliente_telefono: String(folioData.cliente_telefono || '').trim(),
            cliente_telefono_extra: folioData.cliente_telefono_extra ? String(folioData.cliente_telefono_extra).trim() : null,

            fecha_entrega: folioData.fecha_entrega,
            hora_entrega: folioData.hora_entrega,
            ubicacion_entrega: folioData.ubicacion_entrega || 'En Sucursal',

            tipo_folio: folioData.tipo_folio || 'Normal',
            forma: folioData.forma || null,
            numero_personas: folioData.numero_personas ? safeNum(folioData.numero_personas) : null,

            sabores_pan: resolvedSabores,
            rellenos: resolvedRellenos,
            complementos: Array.isArray(folioData.complementos) ? folioData.complementos : [],

            descripcion_diseno: folioData.descripcion_diseno || null,
            imagen_referencia_url: folioData.imagen_referencia_url || null,
            diseno_metadata: folioData.diseno_metadata, // updated above

            costo_base, costo_envio, anticipo, total, estatus_pago,
            estatus_produccion: folioData.estatus_produccion || 'Pendiente',
            estatus_folio: folioData.estatus_folio || 'Activo',
        });

        // Commission Logic
        try {
            const applyComm = folioData.aplicar_comision_cliente === true || folioData.aplicar_comision_cliente === 'true';
            await commissionService.createCommission({
                folioNumber: row.folio_numero,
                total: row.total,
                appliedToCustomer: applyComm,
                userId: req.user?.id
            });
        } catch (commError) {
            console.error(`[Commission] FAILED:`, commError);
        }

        auditService.log('CREATE', 'FOLIO', row.id, { folio: row.folio_numero }, req.user?.id);
        res.status(201).json(row);
    } catch (e) {
        console.error(`[CreateFolio] CRITICAL ERROR (Req: ${req.requestId}):`, e);

        const requestId = req.requestId;

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
        const row = await findScoped(req, req.params.id);
        if (!row) return res.status(404).json({ message: 'Folio no encontrado (o sin acceso)' });

        const p = req.body;
        await row.update(p);

        res.json(row);
    } catch (e) {
        console.error('updateFolio:', e);
        res.status(500).json({ message: 'Error actualizando folio' });
    }
};

// ✅ CANCEL
exports.cancelFolio = async (req, res) => {
    try {
        const row = await findScoped(req, req.params.id);
        if (!row) return res.status(404).json({ message: 'Folio no encontrado' });

        await row.update({
            estatus_folio: 'Cancelado',
            cancelado_en: new Date(),
            motivo_cancelacion: req.body?.motivo || null,
        });

        auditService.log('CANCEL', 'FOLIO', row.id, { motivo: req.body?.motivo }, req.user?.id);
        res.json({ message: 'Folio cancelado', folio: row });
    } catch (e) {
        console.error('cancelFolio:', e);
        res.status(500).json({ message: 'Error cancelando folio' });
    }
};

// Status update
exports.updateFolioStatus = async (req, res) => {
    try {
        const row = await findScoped(req, req.params.id);
        if (!row) return res.status(404).json({ message: 'Folio no encontrado' });

        await row.update({
            estatus_produccion: req.body.status ?? row.estatus_produccion
        });
        res.json(row);
    } catch (e) {
        console.error("updateStatus:", e);
        res.status(500).json({ message: 'Error' });
    }
};

// ✅ DELETE
exports.deleteFolio = async (req, res) => {
    try {
        const row = await findScoped(req, req.params.id);
        if (!row) return res.status(404).json({ message: 'Folio no encontrado' });

        await row.destroy();
        auditService.log('DELETE', 'FOLIO', req.params.id, {}, req.user?.id);
        res.json({ message: 'Eliminado' });
    } catch (e) {
        console.error('deleteFolio:', e);
        res.status(500).json({ message: 'Error eliminando folio' });
    }
};

// ✅ CALENDAR
exports.getCalendarEvents = async (req, res) => {
    try {
        const { start, end } = req.query;
        const tenantFilter = buildTenantWhere(req);

        const where = { ...tenantFilter };
        if (start && end) {
            where.fecha_entrega = { [Op.between]: [start, end] };
        }

        const rows = await Folio.findAll({
            where,
            order: [['fecha_entrega', 'ASC'], ['hora_entrega', 'ASC']],
        });

        const events = rows.map(f => ({
            id: String(f.id),
            title: `${f.folio_numero} • ${f.cliente_nombre}`,
            start: `${f.fecha_entrega}T${f.hora_entrega}`,
            statusPago: f.estatus_pago,
            statusFolio: f.estatus_folio,
            color: f.estatus_folio === 'Cancelado' ? '#ef4444' : f.estatus_pago === 'Pagado' ? '#10b981' : '#f59e0b'
        }));

        res.json(events);
    } catch (e) {
        console.error('getCalendarEvents:', e);
        res.status(500).json({ message: 'Error calendario' });
    }
};

// ✅ DASHBOARD
exports.getDashboardStats = async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        const tenantFilter = buildTenantWhere(req);

        const baseWhere = { ...tenantFilter, estatus_folio: { [Op.ne]: 'Cancelado' } };

        const totalCount = await Folio.count({ where: baseWhere });
        const pendingCount = await Folio.count({ where: { ...baseWhere, estatus_produccion: 'Pendiente' } });
        const todayCount = await Folio.count({ where: { ...baseWhere, fecha_entrega: today } });

        const sumTotal = await Folio.sum('total', { where: baseWhere }) || 0;
        const sumAnticipo = await Folio.sum('anticipo', { where: baseWhere }) || 0;

        const recientes = await Folio.findAll({
            where: tenantFilter,
            limit: 5,
            order: [['createdAt', 'DESC']]
        });

        const populares = [
            { name: 'Chocolate', value: 45 },
            { name: 'Vainilla', value: 30 },
            { name: 'Red Velvet', value: 25 },
            { name: 'Zanahoria', value: 15 },
        ];

        res.json({
            metrics: {
                totalOrders: totalCount,
                pendingOrders: pendingCount,
                todayOrders: todayCount,
                totalSales: Number(sumTotal),
                totalAdvance: Number(sumAnticipo)
            },
            recientes,
            populares
        });
    } catch (e) {
        console.error('getDashboardStats:', e);
        res.status(500).json({ message: 'Error stats' });
    }
};

// ✅ PDF and others
exports.generarPDF = async (req, res) => {
    try {
        const folio = await findScoped(req, req.params.id);
        if (!folio) return res.status(404).json({ message: 'Folio no encontrado' });

        const watermark = computeWatermark(folio);

        // --- Branding Injection ---
        // Determine Owner from user context OR if it's not clear (public access?), from Folio's creator?
        // Ideally we use req.user context if logged in.
        let templateConfig = {};
        if (req.user) {
            const ownerId = req.user.ownerId || req.user.id;
            const PdfTemplate = require('../models/PdfTemplate');
            const template = await PdfTemplate.findOne({ where: { ownerId } });
            if (template) templateConfig = template.configJson;
        }

        const buffer = await pdfService.renderFolioPdf({
            folio: folio.toJSON(),
            watermark,
            templateConfig
        });

        if (!buffer || buffer.length === 0) throw new Error("PDF Buffer is empty");

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="${folio.folio_numero}.pdf"`);
        res.setHeader('Content-Length', buffer.length);
        res.send(buffer);
    } catch (e) {
        console.error('generarPDF:', e);
        res.status(500).json({ message: 'Error generando PDF', details: e.message });
    }
};

exports.generarEtiqueta = async (req, res) => {
    try {
        const folio = await findScoped(req, req.params.id);
        if (!folio) return res.status(404).json({ message: 'Folio no encontrado' });

        const buffer = await pdfService.renderLabelPdf({ folio: folio.toJSON() });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="label-${folio.folio_numero}.pdf"`);
        res.send(buffer);
    } catch (e) {
        res.status(500).json({ message: 'Error Etiqueta' });
    }
};

exports.generarResumenDia = async (req, res) => {
    try {
        const { date } = req.query;
        if (!date) return res.status(400).json({ message: 'Fecha requerida' });

        const tenantFilter = buildTenantWhere(req);

        const folios = await Folio.findAll({
            where: { fecha_entrega: date, ...tenantFilter },
            order: [['hora_entrega', 'ASC']]
        });

        const buffer = await pdfService.renderOrdersPdf({
            folios: folios.map(f => f.toJSON()),
            date
        });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="resumen-${date}.pdf"`);
        return res.send(buffer);

    } catch (e) {
        return res.status(500).json({ message: 'Error Reporte', error: e.message });
    }
};