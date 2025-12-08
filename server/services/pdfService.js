const pdf = require('html-pdf-node');
const ejs = require('ejs');
const path = require('path');

// --- FUNCIÓN EXISTENTE PARA PDF INDIVIDUAL (SIN CAMBIOS) ---
exports.createPdf = async (folioData) => {
    try {
        console.log('📄 [PDF SERVICE] Generando PDF para folio:', folioData.folioNumber);
        if (folioData.imageUrls) {
            console.log('   🖼️ Imágenes recibidas en servicio PDF:', folioData.imageUrls);
        }
        const templatePath = path.join(__dirname, '../templates/folioTemplate.ejs');
        const html = await ejs.renderFile(templatePath, { folio: folioData });

        // 1. Creamos el texto del pie de página dinámicamente
        const footerText = `Pedido capturado por: ${folioData.responsibleUser.username} el ${new Date(folioData.createdAt).toLocaleString('es-MX', { timeZone: 'America/Mexico_City' })}`;

        // 2. Modificamos las opciones del PDF
        const options = {
            format: 'Letter',
            printBackground: true,
            displayHeaderFooter: true, // <-- Habilita el pie de página
            margin: {
                top: '25px',
                right: '25px',
                bottom: '40px', // <-- Espacio para el pie de página
                left: '25px'
            },
            // 3. Añadimos la plantilla del pie de página
            footerTemplate: `
          <div style="width: 100%; font-size: 9pt; text-align: center; padding: 10px 25px 0 25px; border-top: 1px solid #f0f0f0; box-sizing: border-box;">
            ${footerText}
          </div>
        `
        };

        const file = { content: html };
        const pdfBuffer = await pdf.generatePdf(file, options);
        console.log('✅ PDF de folio individual generado con pie de página.');
        return pdfBuffer;

    } catch (error) {
        console.error('❌ Error durante la creación del PDF individual:', error);
        throw error;
    }
};

/**
 * Función genérica para crear PDFs masivos (etiquetas y comandas).
 * @param {string} templateName - El nombre del archivo de plantilla EJS (sin la extensión).
 * @param {Array} data - Un array de objetos (folios, comisiones, etc.).
 * @param {string} date - La fecha para el título del reporte (opcional).
 */
async function generateBulkPdf(templateName, data, date = null) {
    try {
        const templatePath = path.join(__dirname, `../templates/${templateName}.ejs`);
        const html = await ejs.renderFile(templatePath, { folios: data, date: date, commissions: data }); // Pasamos los datos con diferentes nombres por si acaso

        const options = {
            format: 'Letter',
            printBackground: true,
            margin: {
                top: '20px',
                right: '20px',
                bottom: '20px',
                left: '20px'
            }
        };

        const file = { content: html };
        const pdfBuffer = await pdf.generatePdf(file, options);
        console.log(`✅ PDF masivo de ${templateName} generado.`);
        return pdfBuffer;

    } catch (error) {
        console.error(`❌ Error durante la creación del PDF de ${templateName}:`, error);
        throw error;
    }
}

/**
 * Crea un PDF con las etiquetas de producción para un conjunto de folios.
 * @param {Array} folios - Un array de objetos de folio.
 */
exports.createLabelsPdf = async (folios) => {
    return generateBulkPdf('labelsTemplate', folios);
};

/**
 * Crea un PDF con las comandas de envío para un conjunto de folios.
 * @param {Array} folios - Un array de objetos de folio.
 */
exports.createOrdersPdf = async (folios) => {
    return generateBulkPdf('ordersTemplate', folios);
};

// ==================== INICIO DE LA MODIFICACIÓN ====================
/**
 * Crea un PDF con el reporte de comisiones para una fecha específica.
 * @param {Array} commissions - Un array de objetos de comisión con su folio asociado.
 * @param {string} date - La fecha del reporte en formato YYYY-MM-DD.
 */
exports.createCommissionReportPdf = async (commissions, date) => {
    try {
        const templatePath = path.join(__dirname, '../templates/commissionReportTemplate.ejs');
        const html = await ejs.renderFile(templatePath, { commissions, date });

        const options = {
            format: 'Letter',
            printBackground: true,
            margin: { top: '25px', right: '25px', bottom: '25px', left: '25px' }
        };

        const file = { content: html };
        const pdfBuffer = await pdf.generatePdf(file, options);
        console.log(`✅ PDF de reporte de comisiones generado para la fecha ${date}.`);
        return pdfBuffer;

    } catch (error) {
        console.error(`❌ Error durante la creación del PDF de comisiones:`, error);
        throw error;
    }
};
// ===================== FIN DE LA MODIFICACIÓN ====================== 