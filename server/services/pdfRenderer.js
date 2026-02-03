const puppeteer = require('puppeteer');

let browserPromise = null;

async function getBrowser() {
    if (!browserPromise) {
        browserPromise = puppeteer.launch({
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
            // Si en PROD te falla Chromium, añade:
            // executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
            headless: 'new',
        });
    }
    return browserPromise;
}

async function renderHtmlToPdfBuffer(html, pdfOptions = {}) {
    // Ensure browser is ready
    const browser = await getBrowser();

    // Create page
    const page = await browser.newPage();

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

    } finally {
        // Always close the page
        await page.close();
    }
}

module.exports = { renderHtmlToPdfBuffer };
