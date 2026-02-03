const ejs = require('ejs');
const path = require('path');
const QRCode = require('qrcode');
const { renderHtmlToPdfBuffer } = require('./pdfRenderer');

exports.renderFolioPdf = async ({ folio, watermark, templateConfig }) => {
    try {
        const tpl = path.join(__dirname, '..', 'templates', 'folio-pdf.ejs');

        const baseUrl = process.env.PUBLIC_APP_URL || 'http://localhost:5173';
        const qrUrl = await QRCode.toDataURL(`${baseUrl}/folios/${folio.id}`);

        const html = await ejs.renderFile(tpl, {
            folio,
            watermark,
            qrCode: qrUrl,
            config: templateConfig || {} // Default empty
        });

        return renderHtmlToPdfBuffer(html, {
            format: 'A4',
            margin: { top: '2cm', right: '2cm', bottom: '2cm', left: '2cm' }
        });
    } catch (error) {
        console.error("Error en pdfService:", error);
        throw error;
    }
};

exports.renderLabelPdf = async ({ folio }) => {
    try {
        const tpl = path.join(__dirname, '..', 'templates', 'labelsTemplate.ejs');

        const baseUrl = process.env.PUBLIC_APP_URL || 'http://localhost:5173';
        const qrUrl = await QRCode.toDataURL(`${baseUrl}/folios/${folio.id}`);

        const mappedFolio = {
            id: folio.id,
            folioNumber: folio.folio_numero || folio.id,
            deliveryDate: folio.fecha_entrega,
            deliveryTime: folio.hora_entrega,
            shape: folio.tipo_folio,
            persons: folio.numero_personas,
            hasExtraHeight: false,
            labelType: 'normal',
            qrCode: qrUrl
        };

        const html = await ejs.renderFile(tpl, {
            folios: [mappedFolio],
            date: new Date().toLocaleDateString()
        });

        return renderHtmlToPdfBuffer(html, {
            width: '10cm',
            height: '15cm',
            margin: { top: '0.5cm', right: '0.5cm', bottom: '0.5cm', left: '0.5cm' }
        });
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