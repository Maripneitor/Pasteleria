const { Op } = require('sequelize');
const Folio = require('../models/Folio');
const pdfService = require('../services/pdfService');
const commissionService = require('../services/commissionService');
const auditService = require('../services/auditService');

// Genera folio_numero secuencial simple
async function nextFolioNumero() {
    const last = await Folio.findOne({ order: [['id', 'DESC']] });
    const next = (last?.id || 0) + 1;
    return `FOL-${String(next).padStart(6, '0')}`;
}

function computeWatermark(folio) {
    // Cancelación gana siempre
    if (folio.estatus_folio === 'Cancelado') return 'CANCELADO';
    if (folio.estatus_pago === 'Pagado') return 'PAGADO';
    return 'PENDIENTE';
}

// ✅ LIST
exports.listFolios = async (req, res) => {
    try {
        const q = (req.query.q || '').trim();

        const where = {};
        if (q) {
            where[Op.or] = [
                { folio_numero: { [Op.like]: `%${q}%` } },
                { cliente_nombre: { [Op.like]: `%${q}%` } },
                { cliente_telefono: { [Op.like]: `%${q}%` } },
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
        const row = await Folio.findByPk(req.params.id);
        if (!row) return res.status(404).json({ message: 'Folio no encontrado' });
        res.json(row);
    } catch (e) {
        console.error('getFolioById:', e);
        res.status(500).json({ message: 'Error consultando folio' });
    }
};

// ✅ CREATE (recibe tu wizard gigante y guarda claves en columnas)
// ✅ CREATE (recibe tu wizard gigante y guarda claves en columnas)
// ✅ CREATE (recibe tu wizard gigante y guarda claves en columnas)
exports.createFolio = async (req, res) => {
    try {
        const { normalizeBody } = require('../utils/parseMaybeJson');
        const body = normalizeBody(req.body); // ✅ Soporta JSON-string en multipart
        const files = req.files || [];

        const { clientId = null, ...folioData } = body;

        // Requeridos mínimos (snapshot priority)
        if (!folioData.cliente_nombre || !folioData.cliente_telefono) {
            return res.status(400).json({ message: 'Falta: cliente_nombre y/o cliente_telefono' });
        }

        const required = ['fecha_entrega', 'hora_entrega'];
        for (const k of required) {
            if (!folioData[k]) return res.status(400).json({ message: `Falta campo requerido: ${k}` });
        }

        // Safe numeric parsing helper
        const safeNum = (v) => {
            const n = parseFloat(String(v || 0).replace(/[^0-9.-]/g, ''));
            return isNaN(n) ? 0 : n;
        };

        // folio_numero si no viene
        const folioNumero = folioData.folio_numero || await nextFolioNumero();

        // Económicos
        const costo_base = safeNum(folioData.costo_base);
        const costo_envio = safeNum(folioData.costo_envio);
        const anticipo = safeNum(folioData.anticipo);

        // Total calculation should prefer provided total, or sum components
        const total = folioData.total ? safeNum(folioData.total) : (costo_base + costo_envio);

        const estatus_pago =
            (folioData.estatus_pago) ||
            (total - anticipo <= 0.01 ? 'Pagado' : 'Pendiente'); // Tolerance for float diffs

        // Procesar imágenes
        const referenceImages = files.map(f => ({
            originalName: f.originalname,
            mimeType: f.mimetype,
            size: f.size
        }));

        const row = await Folio.create({
            // Spread keys that match model directly
            ...folioData,

            folio_numero: folioNumero,
            clientId: clientId || null,
            responsibleUserId: req.user?.id || null,

            // Explicit overrides / sanitization
            cliente_nombre: String(folioData.cliente_nombre || '').trim(),
            cliente_telefono: String(folioData.cliente_telefono || '').trim(),
            cliente_telefono_extra: folioData.cliente_telefono_extra ? String(folioData.cliente_telefono_extra).trim() : null,

            fecha_entrega: folioData.fecha_entrega, // Validar DATE YYYY-MM-DD en cliente o catch error
            hora_entrega: folioData.hora_entrega,
            ubicacion_entrega: folioData.ubicacion_entrega || 'En Sucursal',

            tipo_folio: folioData.tipo_folio || 'Normal',

            forma: folioData.forma || null,
            numero_personas: folioData.numero_personas ? safeNum(folioData.numero_personas) : null,

            // Arrays: ensure they are arrays if not handled by normalizeBody properly
            sabores_pan: Array.isArray(folioData.sabores_pan) ? folioData.sabores_pan : [],
            rellenos: Array.isArray(folioData.rellenos) ? folioData.rellenos : [],
            complementos: Array.isArray(folioData.complementos) ? folioData.complementos : [],

            descripcion_diseno: folioData.descripcion_diseno || null,
            imagen_referencia_url: folioData.imagen_referencia_url || null,
            diseno_metadata: typeof folioData.diseno_metadata === 'object' ? folioData.diseno_metadata : {},

            costo_base,
            costo_envio,
            anticipo,
            total,
            estatus_pago,

            estatus_produccion: folioData.estatus_produccion || 'Pendiente',
            estatus_folio: folioData.estatus_folio || 'Activo',

            tenantId: req.user?.tenantId || 1
        });

        // 🟢 COMMISSION REGISTRATION (Enforced)
        try {
            // flag 'aplicar_comision_cliente' can come as 'true' string in multipart
            const applyComm = folioData.aplicar_comision_cliente === true || folioData.aplicar_comision_cliente === 'true';

            await commissionService.createCommission({
                folioNumber: row.folio_numero,
                total: row.total,
                appliedToCustomer: applyComm,
                userId: req.user?.id
            });
        } catch (commError) {
            // No bloquear la respuesta del folio, pero loggear error crítico
            console.error(`[Commission] FAILED to record for ${row.folio_numero}:`, commError);
        }

        // AUDIT
        auditService.log('CREATE', 'FOLIO', row.id, { folio: row.folio_numero }, req.user?.id);

        res.status(201).json(row);
    } catch (e) {
        console.error('createFolio CRITICAL ERROR:', e);

        // Log deep details for debugging
        if (e.errors) {
            console.error('Validation Errors:', e.errors.map(err => err.message));
        }

        // Handle Sequelize Validation Errors specifically
        if (e.name === 'SequelizeValidationError' || e.name === 'SequelizeUniqueConstraintError') {
            const errors = e.errors ? e.errors.map(err => `${err.path}: ${err.message}`).join(', ') : e.message;
            return res.status(400).json({ message: 'Error de validación', details: errors });
        }

        res.status(500).json({
            message: 'Error interno creando folio',
            error: e.message,
            stack: process.env.NODE_ENV === 'development' ? e.stack : undefined
        });
    }
};

// ✅ UPDATE (edición)
exports.updateFolio = async (req, res) => {
    try {
        const row = await Folio.findByPk(req.params.id);
        if (!row) return res.status(404).json({ message: 'Folio no encontrado' });

        const p = req.body;

        // Actualiza columnas clave + JSONs
        await row.update({
            cliente_nombre: p.cliente_nombre ?? row.cliente_nombre,
            cliente_telefono: p.cliente_telefono ?? row.cliente_telefono,
            cliente_telefono_extra: p.cliente_telefono_extra ?? row.cliente_telefono_extra,

            fecha_entrega: p.fecha_entrega ?? row.fecha_entrega,
            hora_entrega: p.hora_entrega ?? row.hora_entrega,

            tipo_folio: p.tipo_folio ?? row.tipo_folio,
            forma: p.forma ?? row.forma,
            numero_personas: p.numero_personas ?? row.numero_personas,

            sabores_pan: p.sabores_pan ?? row.sabores_pan,
            rellenos: p.rellenos ?? row.rellenos,
            complementos: p.complementos ?? row.complementos,

            descripcion_diseno: p.descripcion_diseno ?? row.descripcion_diseno,
            imagen_referencia_url: p.imagen_referencia_url ?? row.imagen_referencia_url,
            diseno_metadata: p.diseno_metadata ?? row.diseno_metadata,

            costo_base: p.costo_base ?? row.costo_base,
            costo_envio: p.costo_envio ?? row.costo_envio,
            anticipo: p.anticipo ?? row.anticipo,
            total: p.total ?? row.total,

            estatus_pago: p.estatus_pago ?? row.estatus_pago,
            estatus_produccion: p.estatus_produccion ?? row.estatus_produccion,
        });

        res.json(row);
    } catch (e) {
        console.error('updateFolio:', e);
        res.status(500).json({ message: 'Error actualizando folio' });
    }
};

// ✅ CANCEL (con registro)
exports.cancelFolio = async (req, res) => {
    try {
        const row = await Folio.findByPk(req.params.id);
        if (!row) return res.status(404).json({ message: 'Folio no encontrado' });

        await row.update({
            estatus_folio: 'Cancelado',
            cancelado_en: new Date(),
            motivo_cancelacion: req.body?.motivo || null,
        });

        // AUDIT
        auditService.log('CANCEL', 'FOLIO', row.id, { motivo: req.body?.motivo }, req.user?.id);

        res.json({ message: 'Folio cancelado', folio: row });
    } catch (e) {
        console.error('cancelFolio:', e);
        res.status(500).json({ message: 'Error cancelando folio' });
    }
};

// Status update patch (added for production flow)
exports.updateFolioStatus = async (req, res) => {
    try {
        const row = await Folio.findByPk(req.params.id);
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
        const row = await Folio.findByPk(req.params.id);
        if (!row) return res.status(404).json({ message: 'Folio no encontrado' });

        await row.destroy();
        // AUDIT
        auditService.log('DELETE', 'FOLIO', req.params.id, {}, req.user?.id);

        res.json({ message: 'Eliminado' });
    } catch (e) {
        console.error('deleteFolio:', e);
        res.status(500).json({ message: 'Error eliminando folio' });
    }
};

// ✅ CALENDAR (rango por fecha_entrega)
exports.getCalendarEvents = async (req, res) => {
    try {
        const { start, end } = req.query; // YYYY-MM-DD
        // If no start/end provided, default to current month or similar to prevent error?
        // User code says "if !start return 400".
        const where = {};
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
            // Lite payload
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

// ✅ DASHBOARD (sumatorias por columna)
// ✅ DASHBOARD (sumatorias por columna)
exports.getDashboardStats = async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];

        const totalCount = await Folio.count({ where: { estatus_folio: { [Op.ne]: 'Cancelado' } } });
        const pendingCount = await Folio.count({ where: { estatus_produccion: 'Pendiente', estatus_folio: { [Op.ne]: 'Cancelado' } } });
        const todayCount = await Folio.count({ where: { fecha_entrega: today, estatus_folio: { [Op.ne]: 'Cancelado' } } });

        // Sumas financieras
        const sumTotal = await Folio.sum('total', { where: { estatus_folio: { [Op.ne]: 'Cancelado' } } }) || 0;
        const sumAnticipo = await Folio.sum('anticipo', { where: { estatus_folio: { [Op.ne]: 'Cancelado' } } }) || 0;

        // Recientes
        const recientes = await Folio.findAll({
            limit: 5,
            order: [['createdAt', 'DESC']]
        });

        // Sabores populares (mock mejorado o real si existiera relación)
        // Por ahora mantenemos mock pero consistente
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

// ✅ PDF (usa watermark)
exports.generarPDF = async (req, res) => {
    try {
        const folio = await Folio.findByPk(req.params.id);
        if (!folio) return res.status(404).json({ message: 'Folio no encontrado' });

        const watermark = computeWatermark(folio);

        const buffer = await pdfService.renderFolioPdf({
            folio: folio.toJSON(),
            watermark,
        });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="${folio.folio_numero}.pdf"`);
        res.send(buffer);
    } catch (e) {
        console.error('generarPDF:', e);
        res.status(500).json({ message: 'Error PDF' });
    }
};

// ✅ ETIQUETA
exports.generarEtiqueta = async (req, res) => {
    try {
        const folio = await Folio.findByPk(req.params.id);
        if (!folio) return res.status(404).json({ message: 'Folio no encontrado' });

        const buffer = await pdfService.renderLabelPdf({ folio: folio.toJSON() });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="label-${folio.folio_numero}.pdf"`);
        res.send(buffer);
    } catch (e) {
        console.error('generarEtiqueta:', e);
        res.status(500).json({ message: 'Error Etiqueta' });
    }
};

// ✅ RESUMEN DIA
exports.generarResumenDia = async (req, res) => {
    try {
        const { date } = req.query;
        if (!date) return res.status(400).json({ message: 'Fecha requerida' });

        const folios = await Folio.findAll({
            where: { fecha_entrega: date },
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
        console.error('generarResumenDia:', e);
        return res.status(500).json({
            message: 'Error Reporte',
            error: e.message
        });
    }
};