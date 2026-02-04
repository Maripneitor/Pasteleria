const ejs = require('ejs');
const path = require('path');
const QRCode = require('qrcode');
const { renderHtmlToPdfBuffer } = require('./pdfRenderer');

exports.renderFolioPdf = async ({ folio, watermark, templateConfig }) => {
    try {
        const tpl = path.join(__dirname, '..', 'templates', 'folio-pdf.ejs'); // FIX: Correct path to templates

        // 1. Fetch Tenant Config if not provided
        let config = templateConfig || {};
        if (!templateConfig && folio.tenantId) {
            try {
                const { Tenant } = require('../models');
                const tenant = await Tenant.findByPk(folio.tenantId);
                if (tenant) {
                    config = {
                        businessName: tenant.businessName,
                        logoUrl: tenant.logoUrl,
                        primaryColor: tenant.primaryColor,
                        pdfHeaderText: tenant.pdfHeaderText,
                        pdfFooterText: tenant.pdfFooterText
                    };
                }
            } catch (e) {
                console.error('Error fetching tenant for PDF:', e);
            }
        }

        const baseUrl = process.env.PUBLIC_APP_URL || 'http://localhost:5173';
        const qrUrl = await QRCode.toDataURL(`${baseUrl}/folios/${folio.id}`, { errorCorrectionLevel: 'H' });

        const html = await ejs.renderFile(tpl, {
            folio,
            watermark,
            qrCode: qrUrl,
            config // Inject Dynamic Config
        });

        return renderHtmlToPdfBuffer(html, {
            format: 'A4',
            margin: { top: '2cm', right: '2cm', bottom: '2cm', left: '2cm' }
        });
    } catch (error) {
        console.error("Error en pdfService:", error);
        // Detect puppeteer launch errors
        if (error.message.includes('launch') || error.message.includes('browser')) {
            throw new Error("Error: Dependencias de PDF no listas en esta máquina o error de Puppeteer.");
        }
        throw error;
    }
};

exports.renderLabelPdf = async ({ folio, format = 'a4' }) => {
    try {
        const tpl = path.join(__dirname, '..', 'templates', 'labelsTemplate.ejs');
        const baseUrl = process.env.PUBLIC_APP_URL || 'http://localhost:5173';

        // Dynamic QR Logic: Prefer Google Maps Location if available
        let targetUrl = `${baseUrl}/folios/${folio.id}`;
        if (folio.ubicacion_maps && folio.ubicacion_maps.startsWith('http')) {
            targetUrl = folio.ubicacion_maps;
        }

        const qrUrl = await QRCode.toDataURL(targetUrl, { errorCorrectionLevel: 'H' });

        // Simple SVG Logo for Center Overlay (La Fiesta - LF)
        const logoSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="48" fill="white" stroke="#ec4899" stroke-width="4"/><text x="50" y="68" font-family="Arial" font-size="45" font-weight="bold" text-anchor="middle" fill="#ec4899">LF</text></svg>`;
        const logoUrl = `data:image/svg+xml;base64,${Buffer.from(logoSvg).toString('base64')}`;

        const mappedFolio = {
            id: folio.id,
            folioNumber: folio.folio_numero || folio.id,
            deliveryDate: folio.fecha_entrega,
            deliveryTime: folio.hora_entrega,
            shape: folio.tipo_folio,
            persons: folio.numero_personas,
            clientName: folio.cliente_nombre, // Ensure these are mapped
            description: folio.descripcion_diseno || 'Sin descripción',
            hasExtraHeight: folio.altura_extra,
            qrCode: qrUrl,
            logoUrl: logoUrl
        };

        const html = await ejs.renderFile(tpl, {
            folios: [mappedFolio],
            date: new Date().toLocaleDateString(),
            format // 'thermal' or 'a4'
        });

        // Configuración Dual
        let pdfOptions = {};

        if (format === 'thermal') {
            pdfOptions = {
                width: '80mm',
                height: 'auto', // Continuous roll
                margin: { top: '0', right: '0', bottom: '0', left: '0' },
                pageRanges: '1'
            };
        } else {
            // A4 Default (Existing behavior)
            pdfOptions = {
                width: '10cm', // Used to be fixed size stickers? Or A4 page?
                // Step 95 showed: width: '10cm', height: '15cm' for label. 
                // Creating a full A4 sheet of labels is complex if we only have one.
                // Let's keep the "Sticker" size for the 'a4' / 'normal' option to not break legacy, 
                // OR assume A4 means printing this single label on an A4 sheet. 
                // Given the '10cm x 15cm' previous config, that was likely a label printer size too (4x6 inch).
                // Let's stick to the previous dimensions for 'normal/a4' unless user requested full sheet.
                // User said "Hoja Completa (A4)". I should set format A4.
                format: 'A4',
                margin: { top: '1cm', right: '1cm', bottom: '1cm', left: '1cm' }
            };
        }

        return renderHtmlToPdfBuffer(html, pdfOptions);
    } catch (e) {
        console.error("Error renderLabelPdf:", e);
        throw e;
    }
};

exports.renderOrdersPdf = async ({ folios, date, branches }) => {
    try {
        const tpl = path.join(__dirname, '..', 'templates', 'ordersTemplate.ejs');

        // Robust ViewModel mapping
        const mappedFolios = folios.map(f => {
            const total = parseFloat(f.total || 0);
            const anticipo = parseFloat(f.anticipo || 0);
            const balance = total - anticipo;

            return {
                folioNumber: f.folio_numero,
                deliveryDate: f.fecha_entrega,
                deliveryTime: f.hora_entrega,
                client: {
                    name: f.cliente_nombre,
                    phone: f.cliente_telefono,
                    phone2: f.cliente_telefono_extra
                },
                deliveryLocation: f.ubicacion_entrega || 'En Sucursal',
                total: total,
                deliveryCost: parseFloat(f.costo_envio || 0),
                advancePayment: anticipo,
                balance: balance,
                additional: Array.isArray(f.complementos) ? f.complementos : [],
                // Ensure array fields are present for template
                sabores: Array.isArray(f.sabores_pan) ? f.sabores_pan : [],
                rellenos: Array.isArray(f.rellenos) ? f.rellenos : [],
                descripcion: f.descripcion_diseno || ''
            };
        });

        const html = await ejs.renderFile(tpl, {
            folios: mappedFolios,
            date,
            reportType: 'Resumen del Día',
            branches: branches || []
        });

        return renderHtmlToPdfBuffer(html, {
            format: 'A4',
            landscape: true,
            margin: { top: '1cm', right: '1cm', bottom: '1cm', left: '1cm' }
        });
    } catch (e) {
        console.error("Error renderOrdersPdf:", e);
        throw e;
    }
};

exports.renderCommissionsPdf = async ({ reportData, from, to }) => {
    try {
        const tpl = path.join(__dirname, '..', 'templates', 'commissionReport.ejs');

        const html = await ejs.renderFile(tpl, {
            reportData,
            from,
            to
        });

        return renderHtmlToPdfBuffer(html, {
            format: 'A4',
            margin: { top: '2cm', right: '2cm', bottom: '2cm', left: '2cm' }
        });
    } catch (e) {
        console.error("Error renderCommissionsPdf:", e);
        throw e;
    }
};