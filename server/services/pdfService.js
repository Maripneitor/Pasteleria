const ejs = require('ejs');
const path = require('path');
const puppeteer = require('puppeteer');
const QRCode = require('qrcode');

exports.renderFolioPdf = async ({ folio, watermark }) => {
    try {
        const tpl = path.join(__dirname, '..', 'templates', 'folio-pdf.ejs');

        // Generar QR (lo movemos aquí para mantener el controller limpio o lo pasamos desde allá)
        // En la propuesta del usuario, el controller parece pasar datos ya listos, pero el template original usaba qrCode
        const qrUrl = await QRCode.toDataURL(`http://localhost:5173/folios/${folio.id}`);

        const html = await ejs.renderFile(tpl, {
            folio,
            watermarkText: watermark, // Mapeamos 'watermark' a 'watermarkText' que usa el EJS actual
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

exports.renderDaySummaryPdf = async ({ type, date, folios }) => {
    // Placeholder para futuro uso si calendar.js lo pide
    return null;
};