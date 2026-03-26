const { 
    Folio, 
    FolioComplemento, 
    Client, 
    Tenant, 
    Branch, 
    TenantConfig 
} = require('../models');
const { renderPdf } = require('./pdfRenderer');
const path = require('path');
const QRCode = require('qrcode');

/* --- HELPERS --- */

/**
 * Normaliza la configuración de branding asegurando valores por defecto.
 */
async function getTenantBranding(tenantId) {
    try {
        const config = await TenantConfig.findOne({ where: { tenantId } });

        if (config) {
            return {
                businessName: config.businessName || 'La Fiesta',
                logoUrl: normalizeLogo(config.logoUrl),
                primaryColor: config.primaryColor || '#ec4899',
                pdfFooterText: config.footerText || 'Gracias por su preferencia.'
            };
        }

        const tenant = await Tenant.findByPk(tenantId);
        if (tenant) {
            return {
                businessName: tenant.businessName || 'La Fiesta',
                logoUrl: normalizeLogo(tenant.logoUrl),
                primaryColor: tenant.primaryColor || '#ec4899',
                pdfFooterText: 'Gracias por su compra'
            };
        }

        return getDefaultBranding();

    } catch (error) {
        console.error('Error fetching tenant branding:', error);
        return getDefaultBranding();
    }
}

function getDefaultBranding() {
    return {
        businessName: process.env.DEFAULT_TENANT_NAME || 'La Fiesta',
        primaryColor: process.env.DEFAULT_PRIMARY_COLOR || '#ec4899',
        logoUrl: null,
        pdfHeaderText: '',
        pdfFooterText: 'Gracias por su compra'
    };
}

function normalizeLogo(url) {
    if (!url) return null;
    if (url.startsWith('http') || url.startsWith('data:image')) return url;
    return null;
}

/**
 * Busca pedidos asegurando el alcance (scope) por Tenant y Sucursal.
 */
async function findOrderScoped(orderId, ctx) {
    const { tenantId, branchId, role } = ctx;

    const where = {
        id: orderId,
        tenantId: tenantId
    };

    if (branchId && role !== 'SUPER_ADMIN' && role !== 'ADMIN' && role !== 'OWNER') {
        where.branchId = branchId;
    }

    const order = await Folio.findOne({
        where,
        include: [
            { model: Client, as: 'client', required: false },
            { model: FolioComplemento, as: 'complementosList', required: false }
        ]
    });

    if (!order) {
        const error = new Error('Pedido no encontrado o sin acceso.');
        error.status = 404;
        throw error;
    }

    return order;
}

function formatMoney(amount) {
    return Number(amount || 0).toFixed(2);
}

function formatDate(dateStr) {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-MX', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

/**
 * Mapea el modelo Folio al objeto plano (DTO) para los templates EJS.
 */
async function toOrderDTO(order, branding) {
    const plain = order.get({ plain: true });
    const baseUrl = process.env.PUBLIC_APP_URL || 'http://localhost:5173';
    const qrUrl = await QRCode.toDataURL(`${baseUrl}/folios/${plain.id}`, { margin: 2, scale: 4 });
    const mapsLink = plain.ubicacion_maps && plain.ubicacion_maps.startsWith('http') ? plain.ubicacion_maps : null;

    // Helper interno ultra seguro para parsear
    const parseList = (val) => {
        if (!val) return [];
        if (typeof val === 'string') {
            try { return JSON.parse(val); } catch (e) { return []; }
        }
        if (Array.isArray(val)) return val;
        return [];
    };

    const additionals = [
        ...parseList(plain.complementos).map(c => ({ name: c.name || c, price: c.price || 0 })),
        ...parseList(plain.accesorios).map(c => ({ name: c.name || c, price: c.price || 0 }))
    ];

    // 🚀 1. LECTURA SEGURA DE COMPLEMENTARIOS
    const complementosJSON = parseList(plain.complementarios || plain.complementosList || plain.complementos);
    const complementosList = complementosJSON.map(c => ({
        persons: c.numero_personas || c.personas || 'N/A',
        shape: c.forma || 'N/A',
        flavor: Array.isArray(c.sabores_pan) ? c.sabores_pan.join(', ') : (c.sabores_pan || c.sabor_pan || c.sabor || 'N/A'),
        filling: Array.isArray(c.rellenos) ? c.rellenos.join(', ') : (c.rellenos || c.relleno || 'N/A'),
        description: c.descripcion || 'Sin descripción',
        price: c.precio || 0
    }));

    // 🚀 2. LECTURA SEGURA DE PISOS
    const pisosJSON = parseList(plain.detallesPisos || (plain.diseno_metadata ? plain.diseno_metadata.pisos : []) || (plain.diseno_metadata ? plain.diseno_metadata.tiers : []));
    const tiersList = pisosJSON.map((t, idx) => ({
        piso: t.piso || idx + 1,
        persons: t.personas || t.persons || 'N/A',
        panes: Array.isArray(t.sabores_pan) ? t.sabores_pan : parseList(t.sabores_pan || t.panes || t.sabores),
        rellenos: Array.isArray(t.rellenos) ? t.rellenos : parseList(t.rellenos),
        notas: t.notas || ''
    }));

    return {
        id: plain.id,
        folioNumber: plain.folio_numero || plain.id,
        folioType: plain.tipo_folio || 'Normal',
        shape: plain.forma,
        persons: plain.numero_personas,
        createdAt: plain.createdAt,
        formattedDeliveryDate: plain.fecha_entrega,
        formattedDeliveryTime: plain.hora_entrega,
        deliveryLocation: plain.ubicacion_entrega || 'En Sucursal',
        ubicacion_maps_link: mapsLink,
        sabores: parseList(plain.sabores_pan),
        rellenos: parseList(plain.rellenos),
        cubierta: plain.diseno_metadata?.cubierta || null,
        designDescription: plain.descripcion_diseno,
        dedicatoria: plain.dedicatoria,
        imageUrls: plain.imagen_referencia_url ? [plain.imagen_referencia_url] : [],
        
        // Inyectamos arreglos procesados
        tiers: tiersList,
        complements: complementosList, 
        
        total: plain.total,
        advancePayment: plain.anticipo,
        balance: plain.total - plain.anticipo,
        client: {
            name: plain.cliente_nombre || 'Cliente General',
            phone: plain.cliente_telefono || '',
            email: plain.client?.email || ''
        },
        additionals,
        isPaid: plain.estatus_pago === 'Pagado',
        status: plain.status
    };
}


/* --- EXPORTS --- */

exports.generateComandaPdf = async (orderId, ctx) => {
    const order = await findOrderScoped(orderId, ctx);
    const branding = await getTenantBranding(ctx.tenantId);
    const orderDTO = await toOrderDTO(order, branding);

    return await renderPdf({
        templateName: 'comanda',
        data: {
            folio: orderDTO,
            qrCode: await QRCode.toDataURL(`${orderDTO.folioNumber}`, { margin: 0 })
        },
        branding,
        options: {
            format: 'A4',
            printBackground: true,
            margin: { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' }
        }
    });
};

exports.generateNotaVentaPdf = async (orderId, ctx) => {
    const order = await findOrderScoped(orderId, ctx);
    const branding = await getTenantBranding(ctx.tenantId);
    const orderDTO = await toOrderDTO(order, branding);

    return await renderPdf({
        templateName: 'nota-venta',
        data: {
            folio: orderDTO,
            qrCode: await QRCode.toDataURL(process.env.PUBLIC_APP_URL ? `${process.env.PUBLIC_APP_URL}/folios/${order.id}` : `ID:${order.id}`)
        },
        branding,
        options: {
            format: 'A4',
            printBackground: true,
            margin: { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' }
        }
    });
};

exports.renderOrdersPdf = async ({ folios, date, branches }) => {
    try {
        const branding = getDefaultBranding(); 
        return await renderPdf({
            templateName: 'daily-cut',
            data: { folios, date, branches },
            options: {
                format: 'A4',
                printBackground: true,
                margin: { top: '10mm', bottom: '10mm', left: '10mm', right: '10mm' }
            },
            branding
        });
    } catch (error) {
        console.error('Error detallado en renderOrdersPdf:', error.message);
        throw error;
    }
};

/**
 * Genera el reporte de comisiones en PDF.
 * Corregido: 'reportData' es el nombre que espera la plantilla EJS.
 */
exports.renderCommissionsPdf = async ({ reportData, from, to }) => {
    const branding = getDefaultBranding();
    
    // Sincronizamos los nombres con lo que pide la plantilla commissionReport.ejs
    const data = {
        from,
        to,
        reportData: reportData, // <--- Cambiamos 'details' por 'reportData'
        generatedAt: new Date().toLocaleString(),
        branding
    };

    return await renderPdf({
        templateName: 'commissionReport', 
        data: data,
        branding,
        options: {
            format: 'A4',
            printBackground: true,
            margin: { top: '10mm', bottom: '10mm', left: '10mm', right: '10mm' }
        }
    });
};

exports.getDefaultBranding = getDefaultBranding;