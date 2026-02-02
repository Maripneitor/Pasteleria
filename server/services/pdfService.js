const ejs = require('ejs');
const path = require('path');
const puppeteer = require('puppeteer');
const QRCode = require('qrcode');

exports.renderFolioPdf = async ({ folio, watermark }) => {
    try {
        const tpl = path.join(__dirname, '..', 'templates', 'folio-pdf.ejs');

        // Generar QR (lo movemos aquí para mantener el controller limpio o lo pasamos desde allá)
        // En la propuesta del usuario, el controller parece pasar datos ya listos, pero el template original usaba qrCode
        const baseUrl = process.env.PUBLIC_APP_URL || 'http://localhost:5173';
        const qrUrl = await QRCode.toDataURL(`${baseUrl}/folios/${folio.id}`);

        const html = await ejs.renderFile(tpl, {
            folio,
            watermark,
            qrCode: qrUrl
        });

        const browser = await puppeteer.launch({
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'networkidle0' });
        const buffer = await page.pdf({
            format: 'A4',
            margin: { top: '2cm', right: '2cm', bottom: '2cm', left: '2cm' },
            printBackground: true
        });
        await browser.close();
        return buffer;
    } catch (error) {
        console.error("Error en pdfService:", error);
        throw error;
    }
};

exports.renderLabelPdf = async ({ folio }) => {
    try {
        // Usa labelsTemplate pero adaptado para uno solo o lista
        // Si el template espera array, envolvemos.
        const tpl = path.join(__dirname, '..', 'templates', 'labelsTemplate.ejs');

        // Generar QR para el label también
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

        const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'networkidle0' });

        // Formato etiqueta térmica estándar (o mitad carta)
        const buffer = await page.pdf({
            width: '10cm',
            height: '15cm',
            printBackground: true,
            margin: { top: '0.5cm', right: '0.5cm', bottom: '0.5cm', left: '0.5cm' }
        });

        await browser.close();
        return buffer;
    } catch (e) {
        console.error("Error renderLabelPdf:", e);
        throw e;
    }
};

exports.renderOrdersPdf = async ({ folios, date, branches }) => {
    try {
        const tpl = path.join(__dirname, '..', 'templates', 'ordersTemplate.ejs');

        // Map snake_case model data to CamelCase template expectations
        const mappedFolios = folios.map(f => {
            const additional = Array.isArray(f.complementos) ? f.complementos : [];

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
                total: f.total || 0,
                deliveryCost: f.costo_envio || 0,
                advancePayment: f.anticipo || 0,
                balance: balance,
                additional: additional
            };
        });

        const html = await ejs.renderFile(tpl, {
            folios: mappedFolios, // Pass as 'folios' to match template variable
            date,
            reportType: 'Resumen del Día',
            branches: branches || []
        });

        const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'networkidle0' });

        const buffer = await page.pdf({
            format: 'A4',
            landscape: true,
            printBackground: true,
            margin: { top: '1cm', right: '1cm', bottom: '1cm', left: '1cm' }
        });

        await browser.close();
        return buffer;
    } catch (e) {
        console.error("Error renderOrdersPdf:", e);
        throw e;
    }
};