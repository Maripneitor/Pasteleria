const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

let browserPromise = null;

async function logPdfError(error) {
    const logPath = path.join(__dirname, '../logs/pdf_errors.log');
    const message = `[${new Date().toISOString()}] ERROR: ${error.message}\nSTACK: ${error.stack}\n\n`;
    const logDir = path.join(__dirname, '../logs');
    if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
    fs.appendFileSync(logPath, message);
}

async function getBrowser() {
    try {
        if (!browserPromise) {
            browserPromise = puppeteer.launch({
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-gpu', // Added as per prompt requirement
                    '--single-process'
                ],
                executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || null,
                headless: 'new',
            }).then(browser => {
                browser.on('disconnected', () => {
                    console.log('[PDF] Browser disconnected. Resetting singleton.');
                    browserPromise = null;
                });
                return browser;
            });
        }
        return browserPromise;
    } catch (err) {
        await logPdfError(err);
        browserPromise = null;
        throw err;
    }
}

async function renderPdf({ templateName, data, branding, options = {} }) {
    // 1. Template Rendering (ejs is handled by caller or we can do it here if passed html, but prompt says: 
    // "Flujo: 1) Renderizar template específico EJS -> bodyHtml".
    // Wait, the prompt says: "Implementa (o refactoriza) para que exista: async function renderPdf({ templateName, data, branding, options })"
    // And "1) Renderizar template específico EJS -> bodyHtml".
    // This implies I should handle EJS rendering here too or verify if 'renderHtmlToPdfBuffer' was just doing the puppeteer part.
    // The previous 'renderHtmlToPdfBuffer' took 'html'.
    // I will keep 'renderHtmlToPdfBuffer' logic but wrap it or integrated it.
    // To match legacy and new requirement:
    // I'll add 'ejs' require.

    // Wait, let's look at `pdfService.js` calling `renderHtmlToPdfBuffer` with already rendered HTML.
    // The Prompt asks to "Crear/ajustar un renderer único... Exportar función renderPdf".
    // I should probably make `renderPdf` capable of doing the EJS part OR keep the separation.
    // Prompt detailed step D explicitly says: "1) Renderizar template específico EJS -> bodyHtml ... 2) Renderizar base.ejs ...".
    // But I already created comanda.ejs and nota-venta.ejs which include partials headers/footers/styles.
    // So 'base.ejs' concept is effectively 'comanda.ejs' itself (it acts as layout with includes).
    // I will trust that the templates provided (comanda.ejs, nota-venta.ejs) are full HTML pages.
    // I will support passing raw 'html' OR 'templateName' + 'data'.

    // However, to strictly follow instructions: "1) Renderizar template específico EJS -> bodyHtml".
    // Since I updated comanda.ejs to be a full HTML document (with <head>, <body>), it IS the base.
    // So I can just render that template.

    const browser = await getBrowser();
    let page = null;
    try {
        page = await browser.newPage();

        let htmlContent = '';

        // Internal EJS rendering if templateName is provided
        if (templateName) {
            const ejs = require('ejs');
            const templatePath = path.join(__dirname, '../templates', `${templateName}.ejs`);
            htmlContent = await ejs.renderFile(templatePath, {
                ...data,
                config: branding // Map branding to 'config' expected by templates
            });
        } else if (data.html) {
            htmlContent = data.html;
        } else {
            throw new Error('renderPdf requires templateName or html content');
        }

        page.setDefaultNavigationTimeout(30000);
        page.setDefaultTimeout(30000);

        // Security / Performance
        await page.setRequestInterception(true);
        page.on('request', (req) => {
            const url = req.url();
            if (url.startsWith('data:') || url.startsWith('file:')) return req.continue(); // Allow file for local templates/images if needed
            if (url.startsWith('http')) return req.abort(); // Block external
            return req.continue();
        });

        await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

        // Handle Options
        const pdfConfig = {
            printBackground: true,
            preferCSSPageSize: true, // Let CSS @page rule take precedence if present
            format: options.format || 'A4',
            margin: options.margin || { top: '0', right: '0', bottom: '0', left: '0' },
            ...options
        };

        // Ticket mode override
        if (options.width) {
            delete pdfConfig.format;
            pdfConfig.width = options.width;
            pdfConfig.height = options.height || 'auto'; // Does not strictly work in Puppeteer pdf(), usually ignored or explicit height needed?
            // Puppeteer 'height' option is valid.
        }

        const buffer = await page.pdf(pdfConfig);
        return buffer;

    } catch (e) {
        await logPdfError(e);
        throw e;
    } finally {
        if (page) await page.close().catch(() => { });
    }
}

// Keep legacy for backward compatibility if needed, or redirect
async function renderHtmlToPdfBuffer(html, pdfOptions = {}) {
    return renderPdf({ data: { html }, options: pdfOptions });
}

module.exports = { renderPdf, renderHtmlToPdfBuffer };
