const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

let browserPromise = null;

async function logPdfError(error) {
    const logPath = path.join(__dirname, '../logs/pdf_errors.log');
    const message = `[${new Date().toISOString()}] ERROR: ${error.message}\nSTACK: ${error.stack}\n\n`;
    const logDir = path.join(__dirname, '../logs');
    if (!fs.existsSync(logDir)) fs.mkdirSync(logDir);
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
        browserPromise = null; // Reset on launch error
        throw err;
    }
}

async function renderHtmlToPdfBuffer(html, pdfOptions = {}) {
    // Ensure browser is ready
    const browser = await getBrowser();

    // Create page
    let page = null;
    try {
        page = await browser.newPage();
    } catch (err) {
        // If newPage fails, browser might be acting up but not disconnected yet?
        // Force reset
        if (browserPromise) {
            const b = await browserPromise;
            if (b) b.close().catch(() => null);
            browserPromise = null;
        }
        throw err;
    }

    try {
        // Evita que “se cuelgue” por requests eternos
        page.setDefaultNavigationTimeout(30000);
        page.setDefaultTimeout(30000);

        // Bloquea cosas externas si quieres máxima estabilidad
        await page.setRequestInterception(true);
        page.on('request', (req) => {
            const url = req.url();
            // Permite data: (QR base64) y recursos inline.
            if (url.startsWith('data:')) return req.continue();
            // Bloquea http/https externas para que no dependa de internet
            if (url.startsWith('http://') || url.startsWith('https://')) return req.abort();
            return req.continue();
        });

        // Logs útiles cuando algo truena
        page.on('pageerror', (err) => console.error('[PDF pageerror]', err));
        page.on('console', (msg) => console.log('[PDF console]', msg.text()));

        await page.setContent(html, { waitUntil: 'domcontentloaded' });

        // Espera a fuentes (evita saltos de layout)
        try {
            await page.evaluateHandle('document.fonts.ready');
        } catch (e) {
            console.warn('Warning: fonts.ready wait failed', e.message);
        }

        const buffer = await page.pdf({
            printBackground: true,
            preferCSSPageSize: true,
            ...pdfOptions,
        });

        return buffer;

    } catch (e) {
        await logPdfError(e);
        throw e;
    } finally {
        // Always close the page
        if (page) {
            try {
                await page.close();
            } catch (e) { /* ignore safe close */ }
        }
    }
}

module.exports = { renderHtmlToPdfBuffer };
