const { Folio, FolioComplemento, Client, Tenant, Branch } = require('../models');
const { renderPdf } = require('./pdfRenderer');
const path = require('path');
const QRCode = require('qrcode');

/* --- HELPERS --- */

/**
 * Normalizes branding config ensuring safe defaults.
 * @param {number|string} tenantId 
 */
const { TenantConfig } = require('../models');

/**
 * Normalizes branding config ensuring safe defaults.
 * @param {number|string} tenantId 
 */
async function getTenantBranding(tenantId) {
    try {
        const config = await TenantConfig.findOne({ where: { tenantId } });

        if (config) {
            return {
                businessName: config.businessName || 'Mi Pastelería',
                logoUrl: normalizeLogo(config.logoUrl),
                primaryColor: config.primaryColor || '#ec4899',
                // pdfHeaderText: '', // Not in TenantConfig 
                pdfFooterText: config.footerText || 'Gracias por su preferencia.'
            };
        }

        // Fallback to Tenant model (Legacy)
        const tenant = await Tenant.findByPk(tenantId);
        if (tenant) {
            return {
                businessName: tenant.businessName || 'Mi Pastelería',
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
        businessName: 'Pastelería',
        primaryColor: '#ec4899',
        logoUrl: null,
        pdfHeaderText: '',
        pdfFooterText: 'Gracias por su compra'
    };
}

function normalizeLogo(url) {
    if (!url) return null;
    if (url.startsWith('http') || url.startsWith('data:image')) return url;
    // Local file path? Try to resolve if needed, but safer to ignore if strict
    // If it's a relative path from uploads, we could map it to absolute file:// path
    // For now, assume HTTP or Base64 is expected.
    return null;
}

/**
 * Finds order ensuring it belongs to the Tenant/Branch scope.
 */
async function findOrderScoped(orderId, ctx) {
    const { tenantId, branchId, role } = ctx;

    const where = {
        id: orderId,
        tenantId: tenantId
    };

    // Branch scoping for non-admins
    if (branchId && role !== 'SUPER_ADMIN' && role !== 'ADMIN' && role !== 'OWNER') {
        where.branchId = branchId;
    }

    const order = await Folio.findOne({
        where,
        include: [
            { model: Client, as: 'client', required: false }, // Join client
            { model: FolioComplemento, as: 'complementosList', required: false } // Join complements
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
    // dateStr might be YYYY-MM-DD (DATEONLY) or ISO
    const d = new Date(dateStr);
    // Adjust for timezone if needed, but DATEONLY usually parses to UTC 00:00. 
    // If it's YYYY-MM-DD string, let's keep it simple or use locale
    // Ideally use date-fns or similar, but built-in:
    return d.toLocaleDateString('es-MX', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

/**
 * Maps Sequelize Folio model to the Plain Object expected by EJS templates.
 */
async function toOrderDTO(order, branding) {
    const plain = order.get({ plain: true });

    // Generate QR Code for Web View
    const baseUrl = process.env.PUBLIC_APP_URL || 'http://localhost:5173';
    // Link to public tracking or admin view? Usually admin view for internal, tracking for client.
    // Let's assume tracking for client is safer context-wise? Or admin folio link.
    // Prompt says "web view".
    const qrUrl = await QRCode.toDataURL(`${baseUrl}/folios/${plain.id}`, { margin: 2, scale: 4 });
    const mapsLink = plain.ubicacion_maps && plain.ubicacion_maps.startsWith('http') ? plain.ubicacion_maps : null;

    // Parse JSON fields if they are strings (MySQL 8 with Sequelize handles JSON/JSONB automatically, but safety check)
    const parseList = (val) => {
        if (!val) return [];
        if (Array.isArray(val)) return val;
        try { return JSON.parse(val); } catch (e) { return []; }
    };

    const sabores = parseList(plain.sabores_pan);
    const rellenos = parseList(plain.rellenos);
    const tiers = parseList(plain.diseno_metadata?.tiers || []); // Tiers often stored in metadata or JSON
    // Note: Folio model definition didn't show 'tiers' column, but 'diseno_metadata' JSON.
    // Also check `FolioComplemento` relation which serves as 'complementos' (additionals cake).

    // Additional items (candles etc) stored in `complementos` JSON column (legacy) or `accesorios`?
    // Model has `complementos` (JSON) and `accesorios` (JSON).
    // And also `FolioComplemento` (Table).
    // Let's map `FolioComplemento` table as 'Pasteles Adicionales' (structure wise).
    // And `complementos` JSON as 'Artículos Extra' (candles)? 
    // The prompt says "items/additionals".

    const additionals = [
        ...parseList(plain.complementos).map(c => ({ name: c.name || c, price: c.price || 0 })),
        ...parseList(plain.accesorios).map(c => ({ name: c.name || c, price: c.price || 0 }))
    ];

    // Format Complements (Pasteles Extra)
    const complementosList = (plain.complementosList || []).map(c => ({
        persons: c.personas,
        shape: c.forma,
        flavor: c.sabor_pan,
        filling: c.relleno,
        description: c.descripcion,
        price: c.precio
    }));

    return {
        id: plain.id,
        folioNumber: plain.folio_numero || plain.id,
        folioType: plain.tipo_folio || 'Normal',
        shape: plain.forma,
        persons: plain.numero_personas,
        createdAt: plain.createdAt,

        // Delivery
        formattedDeliveryDate: plain.fecha_entrega, // Already YYYY-MM-DD usually
        formattedDeliveryTime: plain.hora_entrega,
        deliveryLocation: plain.ubicacion_entrega || 'En Sucursal',
        ubicacion_maps_link: mapsLink,

        // Items
        sabores: sabores,
        rellenos: rellenos,
        cubierta: plain.diseno_metadata?.cubierta || null,
        designDescription: plain.descripcion_diseno,
        dedication: plain.dedicatoria,
        imageUrls: plain.imagen_referencia_url ? [plain.imagen_referencia_url] : [], // TODO: support multiple

        // Tiers (Pisos)
        tiers: tiers.map(t => ({
            persons: t.personas || t.persons,
            panes: parseList(t.sabores || t.panes),
            rellenos: parseList(t.rellenos),
            notas: t.notas
        })),

        // Financials
        total: plain.total,
        advancePayment: plain.anticipo,
        balance: plain.total - plain.anticipo,
        basePrice: plain.costo_base,
        deliveryCost: plain.costo_envio,
        totalExtras: 0, // Calculate if needed

        // Client
        client: {
            name: plain.cliente_nombre || 'Cliente General',
            phone: plain.cliente_telefono || '',
            email: plain.client?.email || ''
        },

        // Lists
        additionals: additionals, // Extras (candles)
        complements: complementosList, // Extra Cakes

        // Metadata
        isPaid: plain.estatus_pago === 'Pagado',
        status: plain.status // DRAFT, CONFIRMED, etc.
    };
}


/* --- EXPORTS --- */

exports.generateComandaPdf = async (orderId, ctx) => {
    // 1. Fetch Data
    const order = await findOrderScoped(orderId, ctx);
    const branding = await getTenantBranding(ctx.tenantId);

    // 2. Map to DTO
    const orderDTO = await toOrderDTO(order, branding);

    // 3. Render
    return await renderPdf({
        templateName: 'comanda',
        data: {
            folio: orderDTO,
            qrCode: await QRCode.toDataURL(`${orderDTO.folioNumber}`, { margin: 0 }) // Short QR for production internal use?
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
        return await require('./pdfRenderer').renderPdf({
            templateName: 'daily-cut',
            data: {
                folios,
                date,
                branches
            },
            options: {
                format: 'A4',
                printBackground: true,
                margin: { top: '10mm', bottom: '10mm', left: '10mm', right: '10mm' }
            },
            branding: require('./pdfService').getDefaultBranding // Or empty/default
        });
    } catch (error) {
        console.error('Error rendering orders PDF:', error);
        throw error;
    }
};