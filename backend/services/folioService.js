const { Op } = require('sequelize');
const Folio = require('../models/Folio');
const FolioComplemento = require('../models/FolioComplemento');
const CakeFlavor = require('../models/CakeFlavor');
const Filling = require('../models/Filling');
const PdfTemplate = require('../models/PdfTemplate');

const pdfService = require('./pdfService');
const commissionService = require('./commissionService');
const auditService = require('./auditService');

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

// Helper: Generate Smart Folio ID
async function generateSmartFolio(fechaEntrega, telefono, tenantId) {
    const fecha = new Date(fechaEntrega); // Ensure Date object
    // Adjust for timezone if needed, assuming input is YYYY-MM-DD (UTC 00:00) or Local
    // If it's UTC 00:00, getUTCMonth/Day might work better if we want to be strict, 
    // but usually users treat YYYY-MM-DD as local date for event.
    // Let's use UTC parts to avoid shifting to previous day due to timezone offset

    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

    // Using UTC methods to be safe with 'YYYY-MM-DD' strings
    const mesIndex = fecha.getUTCMonth();
    const diaIndex = fecha.getUTCDay();
    const diaNumero = fecha.getUTCDate().toString().padStart(2, '0');

    const mes = meses[mesIndex];
    const diaSemana = dias[diaIndex];

    const inicialMes = mes.charAt(0);
    const inicialDia = diaSemana.charAt(0);

    const ultimosTelefono = telefono ? String(telefono).replace(/\D/g, '').slice(-4) : '0000';

    let folioBase = `${inicialMes}${inicialDia}-${diaNumero}-${ultimosTelefono}`;
    let folioFinal = folioBase;
    let contador = 1;

    while (true) {
        const exists = await Folio.count({
            where: {
                folioNumber: folioFinal,
                tenantId
            }
        });
        if (exists === 0) break;
        folioFinal = `${folioBase}-${contador}`;
        contador++;
    }

    return folioFinal;
}

class FolioService {

    async listFolios(query, tenantFilter) {
        // ... existing list logic ...
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

        // GENERATE SMART FOLIO
        const folioNumber = await generateSmartFolio(folioData.fecha_entrega, folioData.cliente_telefono, tenantId);

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
            const flavors = await CakeFlavor.findAll({ where: { id: flavorIds, tenantId: tenantId } });
            resolvedSabores = flavors.map(f => f.name);
        }

        if (fillingIds.length > 0) {
            const fillings = await Filling.findAll({ where: { id: fillingIds, tenantId: tenantId } });
            resolvedRellenos = fillings.map(f => f.name);
        }

        // Update Metadata
        if (typeof folioData.diseno_metadata !== 'object') folioData.diseno_metadata = {};
        folioData.diseno_metadata.flavorIds = flavorIds;
        folioData.diseno_metadata.fillingIds = fillingIds;

        // Complements Logic (Additionals)
        const complementsList = Array.isArray(folioData.complementsList) ? folioData.complementsList : [];
        let complementsTotal = 0;
        complementsList.forEach(c => {
            complementsTotal += safeNum(c.precio);
        });

        let finalTotal = total;
        if (!folioData.total) { // Recalculate if not explicit
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

        // Create Complements (DB)
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
        await row.update({ estatus_produccion: status ?? row.estatus_produccion });
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

        return {
            metrics: {
                totalOrders: totalCount,
                pendingOrders: pendingCount,
                todayOrders: todayCount,
                totalSales: Number(sumTotal),
                totalAdvance: Number(sumAnticipo)
            },
            recientes,
            populares: []
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

    // --- PDF GENERATION FOR INDIVIDUAL FOLIO ---
    async generateFolioPdf(id, tenantFilter, user) {
        const folio = await this.getFolioById(id, tenantFilter, true);
        if (!folio) throw { status: 404, message: 'Folio no encontrado' };

        let templateConfig = {};
        // branding logic if needed...

        // This assumes pdfService.renderPdf is available via simple wrapper if we want to bypass specific helpers
        // But let's use the explicit helpers from controller if needed, or generic render
        // Attempt to use pdfService.generateComandaPdf as alias for single?
        // Or generic render:
        const { renderPdf } = require('./pdfRenderer');

        // Helper to get color by day
        const getDayColor = (dateStr) => {
            const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
            const colors = {
                'Lunes': '#0d6efd',
                'Martes': '#6f42c1',
                'Miércoles': '#fd7e14',
                'Jueves': '#198754',
                'Viernes': '#d63384',
                'Sábado': '#ffc107',
                'Domingo': '#adb5bd'
            };
            // Ensure date is treated as local day or UTC day correctly.
            // Since fecha_entrega is YYYY-MM-DD, let's parse it as UTC to avoid timezone shifts
            const d = new Date(dateStr);
            const dayName = days[d.getUTCDay()];
            return colors[dayName] || '#f8f9fa';
        };

        const f = folio.toJSON();

        // Map DB fields to Template DTO
        const folioData = {
            folioNumber: f.folioNumber,
            dayColor: getDayColor(f.fecha_entrega), // Dynamic Color
            textColor: '#000000',
            formattedDeliveryDate: f.fecha_entrega,
            formattedDeliveryTime: f.hora_entrega,
            client: {
                name: f.cliente_nombre || 'Cliente',
                phone: f.cliente_telefono || '',
                phone2: f.cliente_telefono_extra || ''
            },
            deliveryLocation: f.ubicacion_entrega || 'En Sucursal',
            persons: f.numero_personas || 0,
            shape: f.forma || 'Redondo',
            folioType: f.tipo_folio || 'Normal',
            cakeFlavor: Array.isArray(f.sabores_pan) ? f.sabores_pan.join(', ') : (f.sabores_pan || ''),
            filling: Array.isArray(f.rellenos) ? f.rellenos.join(', ') : (f.rellenos || ''),
            hasExtraHeight: f.altura_extra === 'Sí',
            total: f.total || 0,
            deliveryCost: f.costo_envio || 0,
            advancePayment: f.anticipo || 0,
            balance: (parseFloat(f.total || 0) - parseFloat(f.anticipo || 0)),
            designDescription: f.descripcion_diseno || '',
            dedication: f.dedicatoria || '',
            complements: f.complementos || [],
            additional: [],
            accessories: f.accesorios || '',
            isPaid: f.estatus_pago === 'Pagado',
            status: f.estatus_folio,
            imageUrls: f.imagen_referencia_url ? [f.imagen_referencia_url] : []
        };

        const buffer = await renderPdf({
            templateName: 'folioTemplate',
            data: { folio: folioData, watermark: computeWatermark(f) },
            branding: {}
        });

        return { buffer, filename: `${folio.folioNumber}.pdf` };
    }

    // --- DAILY REPORTS ---
    async generateDaySummaryPdfs(date, tenantFilter) {
        if (!date) throw { status: 400, message: 'Fecha requerida' };

        const folios = await Folio.findAll({
            where: { fecha_entrega: date, ...tenantFilter, estatus_folio: { [Op.ne]: 'Cancelado' } },
            order: [['hora_entrega', 'ASC']],
            include: [{ association: 'complementosList' }] // For labels/tiers
        });

        const { renderPdf } = require('./pdfRenderer');

        // 1. Data for Orders (Comandas)
        const foliosData = folios.map(f => {
            const json = f.toJSON();

            // Calculate additional costs if needed
            const additionalCost = 0; // Or sum complements

            return {
                folio: json.folioNumber, // Template uses 'folio' not 'folioNumber'
                horaEntrega: json.hora_entrega, // Template uses 'horaEntrega'
                direccion: json.ubicacion_entrega, // Template uses 'direccion'
                cliente: {
                    nombre: json.cliente_nombre,
                    telefono: json.cliente_telefono,
                    telefono2: json.cliente_telefono_extra
                },
                costo: {
                    pastel: Number(json.total) - Number(json.costo_envio) - additionalCost,
                    envio: Number(json.costo_envio),
                    adicionales: additionalCost,
                    total: Number(json.total),
                    anticipo: Number(json.anticipo)
                }
            };
        });

        const comandasBuffer = await renderPdf({
            templateName: 'ordersTemplate',
            data: { folios: foliosData, date: date, fecha: date },
            options: { format: 'A4', printBackground: true }
        });

        // 2. Data for Labels (Etiquetas)
        const labelsData = [];
        folios.forEach(f => {
            const json = f.toJSON();
            // Main Label
            labelsData.push({
                folio: json.folioNumber,
                horaEntrega: json.hora_entrega,
                forma: json.forma || 'Normal',
                personas: (json.numero_personas || '') + 'p',
                esComplemento: false,
                clientName: json.cliente_nombre
            });

            // Tiers (from diseno_metadata or complementosList?)
            // Assuming complementosList is "Tiers" or "Extra Cakes" as per my previous DTO mapping logic
            // Or if tiers are in JSON
            const tiers = json.diseno_metadata?.tiers || [];
            if (Array.isArray(tiers)) {
                tiers.forEach((t, i) => {
                    labelsData.push({
                        folio: `${json.folioNumber}-P${i + 1}`,
                        horaEntrega: json.hora_entrega,
                        forma: 'Piso ' + (i + 1),
                        personas: (t.personas || t.persons || '') + 'p',
                        esComplemento: false
                    });
                });
            }

            // Complements
            if (json.complementosList && json.complementosList.length > 0) {
                json.complementosList.forEach((c, i) => {
                    labelsData.push({
                        folio: `${json.folioNumber}-C${i + 1}`,
                        horaEntrega: json.hora_entrega,
                        forma: 'Comp.',
                        personas: (c.personas || '') + 'p',
                        esComplemento: true
                    });
                });
            }
        });

        const etiquetasBuffer = await renderPdf({
            templateName: 'labelsTemplate',
            data: { etiquetas: labelsData, date: date, fecha: date },
            // Labels might use specific size or A4 grid? Template handles grid.
            options: { format: 'A4', printBackground: true }
        });

        return { comandasBuffer, etiquetasBuffer };
    }
}

module.exports = new FolioService();
