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

async function findOrderScoped(orderId, ctx) {
    const { tenantId, branchId, role } = ctx;
    const where = { id: orderId, tenantId: tenantId };
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
        error.status = 404; throw error;
    }
    return order;
}

/**
 * Mapea el modelo Folio al objeto plano (DTO) para los templates EJS.
 */
async function toOrderDTO(order, branding) {
    const plain = order.get({ plain: true });
    const baseUrl = process.env.PUBLIC_APP_URL || 'http://localhost:5173';
    const qrUrl = await QRCode.toDataURL(`${baseUrl}/folios/${plain.id}`, { margin: 2, scale: 4 });
    
    const isDelivery = plain.is_delivery === true || plain.is_delivery === 'true' || plain.is_delivery === 1 || plain.is_delivery === '1';
    const mapsLink = isDelivery && plain.ubicacion_maps && plain.ubicacion_maps.startsWith('http') ? plain.ubicacion_maps : null;

    // 🔥 PARSEO AGRESIVO: Destruye JSONs anidados en strings
    const forceParse = (val) => {
        if (!val) return [];
        let parsed = val;
        if (typeof parsed === 'string') { try { parsed = JSON.parse(parsed); } catch(e) {} }
        if (typeof parsed === 'string') { try { parsed = JSON.parse(parsed); } catch(e) {} } // Doble capa
        return Array.isArray(parsed) ? parsed : [];
    };

    let meta = plain.diseno_metadata;
    if (typeof meta === 'string') { try { meta = JSON.parse(meta); } catch(e) {} }
    if (typeof meta === 'string') { try { meta = JSON.parse(meta); } catch(e) {} }
    if (!meta || typeof meta !== 'object') meta = {};

    // 🚀 LÓGICA DE ALTURA EXTRA BLINDADA
    const isExtraHeight = 
        plain.extraHeight === true || 
        String(plain.extraHeight) === 'true' || 
        String(plain.extraHeight) === '1' || 
        plain.altura_extra === 'Sí' || 
        plain.altura_extra === 'Si' || 
        meta.extraHeight === true || 
        String(meta.extraHeight) === 'true' ||
        meta.altura_extra === 'Sí';

    // 🚀 EXTRACCIÓN DE ACCESORIOS BLINDADA
    const rawExtras = [...forceParse(plain.complementos), ...forceParse(plain.accesorios)];
    const additionals = rawExtras.map(c => {
        if (!c) return null;
        if (typeof c === 'string') return { name: c, qty: 1 };
        
        const itemName = c.nombre || c.name || c.descripcion || c.concepto || '';
        const qty = c.cantidad || c.qty || 1;
        
        if (!itemName || String(itemName).trim() === '') return null;
        return { name: String(itemName).trim(), qty: Number(qty) };
    }).filter(a => a !== null); // Quita los nulos

    const complementosList = forceParse(plain.complementarios || plain.complementosList || plain.complementos).map(c => ({
        persons: c.numero_personas || c.personas || 'N/A',
        shape: c.forma || 'N/A',
        flavor: Array.isArray(c.sabores_pan) ? c.sabores_pan.join(', ') : (c.sabor_pan || c.sabor || 'N/A'), 
        filling: Array.isArray(c.rellenos) ? c.rellenos.join(', ') : (c.relleno || 'N/A'),               
        description: c.descripcion || 'Sin descripción'
    }));

    const tiersList = forceParse(plain.detallesPisos || meta.pisos || meta.tiers).map((t, idx) => ({
        piso: t.piso || idx + 1,
        persons: t.personas || t.persons || 'N/A',
        panes: Array.isArray(t.sabores_pan) ? t.sabores_pan : forceParse(t.panes),
        rellenos: Array.isArray(t.rellenos) ? t.rellenos : forceParse(t.rellenos),
        notas: t.notas || ''
    }));

    const safeImages = (meta.allImages && meta.allImages.length > 0) ? meta.allImages : (plain.imagen_referencia_url ? [plain.imagen_referencia_url] : []);

    return {
        id: plain.id,
        folioNumber: plain.folio_numero || plain.id,
        folioType: plain.tipo_folio || 'Normal',
        shape: plain.forma,
        persons: plain.numero_personas,
        createdAt: plain.createdAt,
        formattedDeliveryDate: plain.fecha_entrega,
        formattedDeliveryTime: plain.hora_entrega,
        
        // Aquí pasamos las variables corregidas al PDF
        extraHeight: isExtraHeight,
        additionals: additionals,
        
        is_delivery: isDelivery,
        deliveryLocation: isDelivery ? (plain.ubicacion_entrega || 'Dirección no especificada') : 'En Sucursal',
        ubicacion_maps_link: mapsLink,
        
        sabores: forceParse(plain.sabores_pan),
        rellenos: forceParse(plain.rellenos),
        cubierta: meta.cubierta || null,
        designDescription: plain.descripcion_diseno,
        dedicatoria: plain.dedicatoria,
        dedication: plain.dedicatoria,
        imageUrls: safeImages, 
        tiers: tiersList,
        complements: complementosList, 
        basePrice: plain.costo_base || 0,
        deliveryCost: isDelivery ? parseFloat(plain.costo_envio || 0) : 0,
        total: plain.total,
        advancePayment: plain.anticipo,
        balance: plain.total - plain.anticipo,
        client: {
            name: plain.cliente_nombre || 'Cliente General',
            phone: plain.cliente_telefono || '',
            phoneExtra: plain.cliente_telefono_extra || ''
        },
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
        data: { folio: orderDTO, qrCode: await QRCode.toDataURL(`${orderDTO.folioNumber}`, { margin: 0 }) },
        branding, options: { format: 'A4', printBackground: true, margin: { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' } }
    });
};

exports.generateNotaVentaPdf = async (orderId, ctx) => {
    const order = await findOrderScoped(orderId, ctx);
    const branding = await getTenantBranding(ctx.tenantId);
    const orderDTO = await toOrderDTO(order, branding);
    return await renderPdf({
        templateName: 'nota-venta',
        data: { folio: orderDTO, qrCode: await QRCode.toDataURL(process.env.PUBLIC_APP_URL ? `${process.env.PUBLIC_APP_URL}/folios/${order.id}` : `ID:${order.id}`) },
        branding, options: { format: 'A4', printBackground: true, margin: { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' } }
    });
};

exports.renderOrdersPdf = async ({ folios, date, branches }) => {
    try {
        const branding = getDefaultBranding(); 
        return await renderPdf({
            templateName: 'daily-cut', data: { folios, date, branches },
            options: { format: 'A4', printBackground: true, margin: { top: '10mm', bottom: '10mm', left: '10mm', right: '10mm' } }, branding
        });
    } catch (error) { throw error; }
};

exports.renderCommissionsPdf = async ({ reportData, from, to }) => {
    const branding = getDefaultBranding();
    return await renderPdf({
        templateName: 'commissionReport', data: { from, to, reportData, generatedAt: new Date().toLocaleString(), branding },
        branding, options: { format: 'A4', printBackground: true, margin: { top: '10mm', bottom: '10mm', left: '10mm', right: '10mm' } }
    });
};

exports.getDefaultBranding = getDefaultBranding;