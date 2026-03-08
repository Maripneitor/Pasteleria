const { Op } = require('sequelize');
const Folio = require('../../../models/Folio');
const FolioComplemento = require('../../../models/FolioComplemento');
const CakeFlavor = require('../../../models/CakeFlavor');
const Filling = require('../../../models/Filling');
const { renderPdf } = require('../../../services/pdfRenderer');
const commissionService = require('../../../services/commissionService');
const auditService = require('../../../services/auditService');
const pdfService = require('../../../services/pdfService');

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
    const fecha = new Date(fechaEntrega);
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

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
        const exists = await Folio.count({ where: { folioNumber: folioFinal, tenantId } });
        if (exists === 0) break;
        folioFinal = `${folioBase}-${contador}`;
        contador++;
    }
    return folioFinal;
}

class FolioService {
    async listFolios(query, tenantFilter) {
        const q = (query.q || '').trim();
        const where = { ...tenantFilter };

        if (q) {
            // Esto permite que si buscas "Juan", lo busque en nombre, tel o folio
            where[Op.or] = [
                { folioNumber: { [Op.like]: `%${q}%` } },
                { cliente_nombre: { [Op.like]: `%${q}%` } },
                { cliente_telefono: { [Op.like]: `%${q}%` } },
            ];
        }

        return Folio.findAll({
            where,
            order: [['createdAt', 'DESC']],
            limit: 10 // No satures el chat, con 10 es suficiente
        });
    }

    async getFolioById(id, tenantFilter, includeComplements = true) {
        // 1. Limpiamos el filtro de sucursal porque los borradores de IA
        // a veces nacen con branchId en null y eso bloquea la búsqueda.
        const safeFilter = { ...tenantFilter };
        delete safeFilter.branchId;

        const options = { where: { id, ...safeFilter } };
        if (includeComplements) {
            options.include = [{ association: 'complementosList' }];
        }
        
        // 2. Agregamos .unscoped() para romper cualquier candado automático
        // que esté escondiendo los estatus "DRAFT".
        return Folio.unscoped().findOne(options);
    }

    async createFolio(folioData, user, tenantId, t = null) {
        if (!folioData.cliente_nombre || !folioData.cliente_telefono) {
            const err = new Error('Datos incompletos: cliente_nombre y/o cliente_telefono');
            err.status = 400;
            err.code = 'VALIDATION_ERROR';
            throw err;
        }

        const required = ['fecha_entrega', 'hora_entrega'];
        for (const k of required) {
            if (!folioData[k]) {
                const err = new Error(`Falta campo requerido: ${k}`);
                err.status = 400;
                err.code = 'VALIDATION_ERROR';
                throw err;
            }
        }

        const folioNumber = await generateSmartFolio(folioData.fecha_entrega, folioData.cliente_telefono, tenantId);
        const costo_base = safeNum(folioData.costo_base);
        const costo_envio = safeNum(folioData.costo_envio);
        const anticipo = safeNum(folioData.anticipo);
        const total = folioData.total ? safeNum(folioData.total) : (costo_base + costo_envio);
        const estatus_pago = (folioData.estatus_pago) || (total - anticipo <= 0.01 ? 'Pagado' : 'Pendiente');

        let resolvedSabores = Array.isArray(folioData.sabores_pan) ? folioData.sabores_pan : [];
        let resolvedRellenos = Array.isArray(folioData.rellenos) ? folioData.rellenos : [];
        const flavorIds = Array.isArray(folioData.flavorIds) ? folioData.flavorIds : [];
        const fillingIds = Array.isArray(folioData.fillingIds) ? folioData.fillingIds : [];

        if (flavorIds.length > 0) {
            const flavors = await CakeFlavor.findAll({ where: { id: flavorIds, tenantId } });
            resolvedSabores = flavors.map(f => f.name);
        }

        if (fillingIds.length > 0) {
            const fillings = await Filling.findAll({ where: { id: fillingIds, tenantId } });
            resolvedRellenos = fillings.map(f => f.name);
        }

        if (typeof folioData.diseno_metadata !== 'object') folioData.diseno_metadata = {};
        folioData.diseno_metadata.flavorIds = flavorIds;
        folioData.diseno_metadata.fillingIds = fillingIds;

        const complementsList = Array.isArray(folioData.complementsList) ? folioData.complementsList : [];
        let complementsTotal = 0;
        complementsList.forEach(c => { complementsTotal += safeNum(c.precio); });

        let finalTotal = total;
        if (!folioData.total) finalTotal = finalTotal + complementsTotal;

        const row = await Folio.create({
            ...folioData,
            folioNumber,
            clientId: folioData.clientId || null,
            responsibleUserId: user?.id || null,
            tenantId,
            cliente_nombre: String(folioData.cliente_nombre || '').trim(),
            cliente_telefono: String(folioData.cliente_telefono || '').trim(),
            total: finalTotal,
            estatus_pago,
            sabores_pan: resolvedSabores,
            rellenos: resolvedRellenos,
            estatus_produccion: folioData.estatus_produccion || 'Pendiente',
            estatus_folio: folioData.estatus_folio || 'Activo',
        }, { transaction: t });

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
            await FolioComplemento.bulkCreate(complementsToCreate, { transaction: t });
        }

        try {
            const applyComm = folioData.aplicar_comision_cliente === true || folioData.aplicar_comision_cliente === 'true';
            await commissionService.createCommission({
                folioNumber: row.folioNumber,
                total: row.total,
                appliedToCustomer: applyComm,
                userId: user?.id
            }, t);
        } catch (commError) {
            console.error(`[Commission] FAILED:`, commError);
        }

        auditService.log('CREATE', 'FOLIO', row.id, { folio: row.folioNumber }, user?.id);
        return row;
    }

    async updateFolio(id, data, tenantFilter, t = null, userId = null) {
        const row = await this.getFolioById(id, tenantFilter, false);
        if (!row) throw { status: 404, message: 'Folio no encontrado' };

        const before = row.toJSON();
        await row.update(data, { transaction: t });

        const changed = {};
        Object.keys(data).forEach((k) => {
            if (JSON.stringify(before[k]) !== JSON.stringify(row[k])) {
                changed[k] = { from: before[k], to: row[k] };
            }
        });

        if (Object.keys(changed).length > 0) {
            auditService.log('UPDATE', 'FOLIO', row.id, { folio: row.folioNumber, changes: changed }, userId);
        }

        return row;
    }

    async cancelFolio(id, motivo, user, tenantFilter, t = null) {
        const row = await this.getFolioById(id, tenantFilter, true);
        if (!row) throw { status: 404, message: 'Folio no encontrado' };
        await row.update({
            estatus_folio: 'Cancelado',
            cancelado_en: new Date(),
            motivo_cancelacion: motivo || null,
        }, { transaction: t });
        auditService.log('CANCEL', 'FOLIO', row.id, { motivo }, user?.id, t);
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
        if (start && end) where.fecha_entrega = { [Op.between]: [start, end] };
        const rows = await Folio.findAll({ where, order: [['fecha_entrega', 'ASC'], ['hora_entrega', 'ASC']] });
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
        
        const f = folio.toJSON();
        const branding = pdfService.getDefaultBranding(); // ✅ Branding real

        const folioData = {
            folioNumber: f.folioNumber,
            formattedDeliveryDate: f.fecha_entrega,
            formattedDeliveryTime: f.hora_entrega,
            client: { name: f.cliente_nombre, phone: f.cliente_telefono, phone2: f.cliente_telefono_extra },
            total: f.total,
            advancePayment: f.anticipo,
            balance: (parseFloat(f.total || 0) - parseFloat(f.anticipo || 0)),
            complements: f.complementosList || [],
            status: f.estatus_folio
        };

        const buffer = await renderPdf({
            templateName: 'folioTemplate',
            data: { folio: folioData, watermark: computeWatermark(f) },
            branding: branding // ✅ Ahora con branding
        });
        return { buffer, filename: `${folio.folioNumber}.pdf` };
    }

    async generateLabelPdf(id, tenantFilter) {
        const folio = await this.getFolioById(id, tenantFilter, false);
        if (!folio) throw { status: 404, message: 'Folio no encontrado' };
        
        const branding = pdfService.getDefaultBranding();

        const buffer = await renderPdf({
            templateName: 'labelsTemplate',
            data: { 
                etiquetas: [{
                    folio: folio.folioNumber,
                    horaEntrega: folio.hora_entrega,
                    personas: folio.numero_personas + 'p',
                    clientName: folio.cliente_nombre
                }],
                fecha: folio.fecha_entrega
            },
            branding: branding,
            options: { format: 'A4', printBackground: true }
        });

        return { buffer, filename: `etiqueta-${folio.folioNumber}.pdf` };
    }

    async generateDaySummaryPdfs(date, tenantFilter) {
        const folios = await Folio.findAll({
            where: { fecha_entrega: date, ...tenantFilter, estatus_folio: { [Op.ne]: 'Cancelado' } },
            order: [['hora_entrega', 'ASC']],
            include: [{ association: 'complementosList' }]
        });

        const branding = pdfService.getDefaultBranding();

        const foliosData = folios.map(f => {
            const json = f.toJSON();
            const base = Number(json.costo_base || 0);
            const envio = Number(json.costo_envio || 0);
            const total = Number(json.total || 0);
            const adicionales = total - base - envio;

            return {
                folio: json.folioNumber,
                horaEntrega: json.hora_entrega,
                cliente: { nombre: json.cliente_nombre, telefono: json.cliente_telefono },
                costo: { 
                    total: total, 
                    anticipo: Number(json.anticipo || 0),
                    pastel: base,
                    envio: envio,
                    adicionales: adicionales > 0 ? adicionales : 0
                }
            };
        });

        const comandasBuffer = await renderPdf({
            templateName: 'ordersTemplate',
            data: { folios: foliosData, fecha: date },
            branding: branding,
            options: { format: 'A4', printBackground: true }
        });

        const labelsData = folios.map(f => ({
            folio: f.folioNumber,
            horaEntrega: f.hora_entrega,
            personas: f.numero_personas + 'p',
            clientName: f.cliente_nombre
        }));

        const etiquetasBuffer = await renderPdf({
            templateName: 'labelsTemplate',
            data: { etiquetas: labelsData, fecha: date },
            branding: branding,
            options: { format: 'A4', printBackground: true }
        });

        return { comandasBuffer, etiquetasBuffer };
    }
}

module.exports = new FolioService();