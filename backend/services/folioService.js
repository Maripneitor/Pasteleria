const { Op } = require('sequelize');
const Folio = require('../models/Folio');
const FolioComplemento = require('../models/FolioComplemento');
const CakeFlavor = require('../models/CakeFlavor');
const Filling = require('../models/Filling');
const PdfTemplate = require('../models/PdfTemplate');

const pdfService = require('./pdfService');
const commissionService = require('./commissionService');
const auditService = require('./auditService');

// Helper: Generate next folio ID
async function nextFolioNumero() {
    const last = await Folio.findOne({ order: [['id', 'DESC']] });
    const next = (last?.id || 0) + 1;
    return `FOL-${String(next).padStart(6, '0')}`;
}

// Helper: Compute Watermark
function computeWatermark(folio) {
    if (folio.estatus_folio === 'Cancelado') return 'CANCELADO';
    if (folio.estatus_pago === 'Pagado') return 'PAGADO';
    return 'PENDIENTE';
}

// Helper: Safe Number
const safeNum = (v) => {
    const n = parseFloat(String(v || 0).replace(/[^0-9.-]/g, ''));
    return isNaN(n) ? 0 : n;
};

class FolioService {

    async listFolios(query, tenantFilter) {
        const q = (query.q || '').trim();
        const where = { ...tenantFilter };

        if (q) {
            where[Op.and] = [
                tenantFilter,
                {
                    [Op.or]: [
                        { folioNumber: { [Op.like]: `%${q}%` } },
                        { cliente_nombre: { [Op.like]: `%${q}%` } },
                        { cliente_telefono: { [Op.like]: `%${q}%` } },
                    ]
                }
            ];
        }

        return Folio.findAll({
            where,
            order: [['createdAt', 'DESC']],
        });
    }

    async getFolioById(id, tenantFilter, includeComplements = true) {
        const options = {
            where: { id, ...tenantFilter }
        };
        if (includeComplements) {
            options.include = [{ association: 'complementosList' }];
        }
        return Folio.findOne(options);
    }

    async createFolio(folioData, user, tenantId) {
        // Validations
        if (!folioData.cliente_nombre || !folioData.cliente_telefono) {
            throw {
                status: 400,
                code: 'VALIDATION_ERROR',
                message: 'Datos incompletos',
                details: ['Falta: cliente_nombre y/o cliente_telefono']
            };
        }

        const required = ['fecha_entrega', 'hora_entrega'];
        for (const k of required) {
            if (!folioData[k]) throw {
                status: 400,
                code: 'VALIDATION_ERROR',
                message: 'Datos incompletos',
                details: [`Falta campo requerido: ${k}`]
            };
        }

        const folioNumber = folioData.folioNumber || await nextFolioNumero();

        const costo_base = safeNum(folioData.costo_base);
        const costo_envio = safeNum(folioData.costo_envio);
        const anticipo = safeNum(folioData.anticipo);
        const total = folioData.total ? safeNum(folioData.total) : (costo_base + costo_envio);

        const estatus_pago = (folioData.estatus_pago) || (total - anticipo <= 0.01 ? 'Pagado' : 'Pendiente');

        // Resolving IDs to Names
        let resolvedSabores = Array.isArray(folioData.sabores_pan) ? folioData.sabores_pan : [];
        let resolvedRellenos = Array.isArray(folioData.rellenos) ? folioData.rellenos : [];
        const flavorIds = Array.isArray(folioData.flavorIds) ? folioData.flavorIds : [];
        const fillingIds = Array.isArray(folioData.fillingIds) ? folioData.fillingIds : [];

        if (flavorIds.length > 0) {
            const flavors = await CakeFlavor.findAll({
                where: { id: flavorIds, tenantId: tenantId }
            });
            resolvedSabores = flavors.map(f => f.name);
        }

        if (fillingIds.length > 0) {
            const fillings = await Filling.findAll({
                where: { id: fillingIds, tenantId: tenantId }
            });
            resolvedRellenos = fillings.map(f => f.name);
        }

        // Update Metadata
        if (typeof folioData.diseno_metadata !== 'object') folioData.diseno_metadata = {};
        folioData.diseno_metadata.flavorIds = flavorIds;
        folioData.diseno_metadata.fillingIds = fillingIds;

        // Complements Logic
        const complementsList = Array.isArray(folioData.complementsList) ? folioData.complementsList : [];
        let complementsTotal = 0;
        complementsList.forEach(c => {
            complementsTotal += safeNum(c.precio);
        });

        let finalTotal = total;
        if (!folioData.total) {
            finalTotal = finalTotal + complementsTotal;
        }

        const row = await Folio.create({
            ...folioData,
            folioNumber: folioNumber,
            clientId: folioData.clientId || null,
            responsibleUserId: user?.id || null,
            tenantId: tenantId,

            cliente_nombre: String(folioData.cliente_nombre || '').trim(),
            cliente_telefono: String(folioData.cliente_telefono || '').trim(),
            cliente_telefono_extra: folioData.cliente_telefono_extra ? String(folioData.cliente_telefono_extra).trim() : null,

            fecha_entrega: folioData.fecha_entrega,
            hora_entrega: folioData.hora_entrega,
            ubicacion_entrega: folioData.ubicacion_entrega || 'En Sucursal',

            calle: folioData.calle || null,
            colonia: folioData.colonia || null,
            referencias: folioData.referencias || null,

            tipo_folio: folioData.tipo_folio || 'Normal',
            forma: folioData.forma || null,
            numero_personas: folioData.numero_personas ? safeNum(folioData.numero_personas) : null,

            sabores_pan: resolvedSabores,
            rellenos: resolvedRellenos,
            complementos: Array.isArray(folioData.complementos) ? folioData.complementos : [],

            descripcion_diseno: folioData.descripcion_diseno || null,
            imagen_referencia_url: folioData.imagen_referencia_url || null,
            diseno_metadata: folioData.diseno_metadata,

            costo_base, costo_envio, anticipo, total: finalTotal, estatus_pago,
            estatus_produccion: folioData.estatus_produccion || 'Pendiente',
            estatus_folio: folioData.estatus_folio || 'Activo',
        });

        // Create Complements
        if (complementsList.length > 0) {
            const complementsToCreate = complementsList.map(c => ({
                folioId: row.id,
                personas: safeNum(c.personas),
                forma: c.forma,
                sabor: c.sabor,
                relleno: c.relleno,
                precio: safeNum(c.precio),
                descripcion: c.descripcion
            }));
            await FolioComplemento.bulkCreate(complementsToCreate);
        }

        // Commission Logic
        try {
            const applyComm = folioData.aplicar_comision_cliente === true || folioData.aplicar_comision_cliente === 'true';
            await commissionService.createCommission({
                folioNumber: row.folioNumber,
                total: row.total,
                appliedToCustomer: applyComm,
                userId: user?.id
            });
        } catch (commError) {
            console.error(`[Commission] FAILED:`, commError);
        }

        auditService.log('CREATE', 'FOLIO', row.id, { folio: row.folioNumber }, user?.id);

        return row;
    }

    async updateFolio(id, data, tenantFilter) {
        const row = await this.getFolioById(id, tenantFilter, true);
        if (!row) throw { status: 404, message: 'Folio no encontrado (o sin acceso)' };

        await row.update(data);
        return row;
    }

    async cancelFolio(id, motivo, user, tenantFilter) {
        const row = await this.getFolioById(id, tenantFilter, true);
        if (!row) throw { status: 404, message: 'Folio no encontrado' };

        await row.update({
            estatus_folio: 'Cancelado',
            cancelado_en: new Date(),
            motivo_cancelacion: motivo || null,
        });

        auditService.log('CANCEL', 'FOLIO', row.id, { motivo }, user?.id);
        return row;
    }

    async deleteFolio(id, user, tenantFilter) {
        const row = await this.getFolioById(id, tenantFilter, true);
        if (!row) throw { status: 404, message: 'Folio no encontrado' };

        await row.destroy();
        auditService.log('DELETE', 'FOLIO', id, {}, user?.id);
    }

    async updateFolioStatus(id, status, tenantFilter) {
        const row = await this.getFolioById(id, tenantFilter, true);
        if (!row) throw { status: 404, message: 'Folio no encontrado' };

        await row.update({
            estatus_produccion: status ?? row.estatus_produccion
        });
        return row;
    }

    async getDashboardStats(tenantFilter) {
        const today = new Date().toISOString().split('T')[0];
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

        // Mocked popular flavors for now
        const populares = [
            { name: 'Chocolate', value: 45 },
            { name: 'Vainilla', value: 30 },
            { name: 'Red Velvet', value: 25 },
            { name: 'Zanahoria', value: 15 },
        ];

        return {
            metrics: {
                totalOrders: totalCount,
                pendingOrders: pendingCount,
                todayOrders: todayCount,
                totalSales: Number(sumTotal),
                totalAdvance: Number(sumAnticipo)
            },
            recientes,
            populares
        };
    }

    async getCalendarEvents(start, end, tenantFilter) {
        const where = { ...tenantFilter };
        if (start && end) {
            where.fecha_entrega = { [Op.between]: [start, end] };
        }

        const rows = await Folio.findAll({
            where,
            order: [['fecha_entrega', 'ASC'], ['hora_entrega', 'ASC']],
        });

        return rows.map(f => ({
            id: String(f.id),
            title: `${f.folioNumber} • ${f.cliente_nombre}`,
            start: `${f.fecha_entrega}T${f.hora_entrega}`,
            statusPago: f.estatus_pago,
            statusFolio: f.estatus_folio,
            color: f.estatus_folio === 'Cancelado' ? '#ef4444' : f.estatus_pago === 'Pagado' ? '#10b981' : '#f59e0b'
        }));
    }

    async generateFolioPdf(id, tenantFilter, user) {
        const folio = await this.getFolioById(id, tenantFilter, true);
        if (!folio) throw { status: 404, message: 'Folio no encontrado' };

        const watermark = computeWatermark(folio);

        let templateConfig = {};
        if (user) {
            const ownerId = user.ownerId || user.id;
            const template = await PdfTemplate.findOne({ where: { ownerId } });
            if (template) templateConfig = template.configJson;
        }

        const buffer = await pdfService.renderFolioPdf({
            folio: folio.toJSON(),
            watermark,
            templateConfig
        });

        return { buffer, filename: `${folio.folioNumber}.pdf` };
    }

    async generateLabelPdf(id, tenantFilter) {
        const folio = await this.getFolioById(id, tenantFilter, true);
        if (!folio) throw { status: 404, message: 'Folio no encontrado' };

        const buffer = await pdfService.renderLabelPdf({ folio: folio.toJSON() });
        return { buffer, filename: `label-${folio.folioNumber}.pdf` };
    }

    async generateDaySummaryPdf(date, tenantFilter) {
        if (!date) throw { status: 400, message: 'Fecha requerida' };

        const folios = await Folio.findAll({
            where: { fecha_entrega: date, ...tenantFilter },
            order: [['hora_entrega', 'ASC']]
        });

        const buffer = await pdfService.renderOrdersPdf({
            folios: folios.map(f => f.toJSON()),
            date
        });

        return { buffer, filename: `resumen-${date}.pdf` };
    }
}

module.exports = new FolioService();
