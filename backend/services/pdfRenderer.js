const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright'); 

/**
 * Función para registrar errores en un archivo de log
 */
async function logPdfError(error) {
    const logPath = path.join(__dirname, '../logs/pdf_errors.log');
    const message = `[${new Date().toISOString()}] ERROR: ${error.message}\nSTACK: ${error.stack}\n\n`;
    const logDir = path.join(__dirname, '../logs');
    if (!fs.existsSync(logDir)) await fs.promises.mkdir(logDir, { recursive: true });
    await fs.promises.appendFile(logPath, message);
}

/**
 * Función de inicialización (Pre-calentamiento)
 * Ahora exportada para que server.js no marque error
 */
async function initBrowser() {
    console.log("[PDF] Motor Playwright cargado. El navegador se abrirá bajo demanda.");
}

/**
 * Función principal de renderizado usando Playwright
 */
async function renderPdf({ templateName, data, branding, options = {} }) {
    let browser = null;
    try {
        // Lanzamos el navegador (Playwright es mucho más estable en WSL/Ubuntu)
        browser = await chromium.launch({
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        const context = await browser.newContext();
        const page = await context.newPage();

        let htmlContent = '';

        // 1. Renderizar el template EJS con los datos y el branding de la pastelería
        if (templateName) {
            const ejs = require('ejs');
            const templatePath = path.join(__dirname, '../templates', `${templateName}.ejs`);
            htmlContent = await ejs.renderFile(templatePath, {
                ...data,
                config: branding 
            });
        } else {
            throw new Error('Se requiere un templateName para generar el PDF');
        }

        // 2. Cargar el HTML y esperar a que la red esté inactiva (asegura carga de imágenes/estilos)
        await page.setContent(htmlContent, { waitUntil: 'networkidle' });

        // 3. Generar el buffer del PDF
        const buffer = await page.pdf({
            format: options.format || 'A4',
            printBackground: true,
            margin: options.margin || { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' },
            width: options.width,
            height: options.height
        });

        return buffer;

    } catch (e) {
        await logPdfError(e);
        console.error("❌ Error en el motor de PDF (Playwright):", e.message);
        throw e;
    } finally {
        // Cerramos el navegador siempre para no dejar procesos colgados
        if (browser) await browser.close();
    }
}

/**
 * Compatibilidad con nombres de funciones anteriores
 */
async function renderHtmlToPdfBuffer(html, pdfOptions = {}) {
    return renderPdf({ data: { html }, options: pdfOptions });
}

// Exportamos todas las funciones necesarias
module.exports = { 
    renderPdf, 
    renderHtmlToPdfBuffer, 
    initBrowser 
};