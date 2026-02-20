const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * Generates a lightweight PDF using PDFKit.
 * Best for text-heavy documents, simple reports, or lists.
 * @param {Object} data - Data to render
 * @param {Object} options - PDFKit options
 * @returns {Promise<Buffer>}
 */
async function renderSimplePdf(data, options = {}) {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({
                size: options.size || 'A4',
                margin: options.margin || 50,
                ...options
            });

            let buffers = [];
            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => {
                const pdfData = Buffer.concat(buffers);
                resolve(pdfData);
            });

            // --- Drawing Logic ---
            // Header
            if (data.title) {
                doc.fontSize(20).text(data.title, { align: 'center' });
                doc.moveDown();
            }

            // Subtitle
            if (data.subtitle) {
                doc.fontSize(14).text(data.subtitle, { align: 'center' });
                doc.moveDown();
            }

            // Content (supports array of items or single text)
            if (Array.isArray(data.items)) {
                data.items.forEach(item => {
                    if (typeof item === 'string') {
                        doc.fontSize(12).text(item);
                    } else if (typeof item === 'object') {
                        // Simple key-value display
                        Object.entries(item).forEach(([key, value]) => {
                            doc.fontSize(10).font('Helvetica-Bold').text(`${key}: `, { continued: true })
                               .font('Helvetica').text(`${value}`);
                        });
                        doc.moveDown(0.5);
                    }
                });
            } else if (data.text) {
                doc.fontSize(12).text(data.text);
            }

            // Footer
            if (data.footer) {
                doc.fontSize(10).text(data.footer, 50, doc.page.height - 50, { align: 'center' });
            }

            doc.end();
        } catch (error) {
            reject(error);
        }
    });
}

module.exports = { renderSimplePdf };
