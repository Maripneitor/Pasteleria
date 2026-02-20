const { renderPdf } = require('../services/pdfRenderer');
const { renderSimplePdf } = require('../services/pdfKitRenderer');

/**
 * Controller to demonstrate the three PDF generation paths.
 */

// 1. Backend with Puppeteer (HTML/CSS fidelity)
exports.generateProfessionalPdf = async (req, res) => {
    try {
        const data = {
            title: "Reporte Profesional de Ventas",
            date: new Date().toLocaleDateString(),
            items: [
                { id: 1, product: "Pastel de Chocolate", amount: "$500" },
                { id: 2, product: "Gelatina de Leche", amount: "$200" }
            ],
            user: req.user?.nombre || "Usuario"
        };

        // We use puppeteer for high fidelity (CSS, fonts, layout)
        // This could use an EJS template or raw HTML
        const buffer = await renderPdf({
            templateName: 'demo-report', // You would create this .ejs in backend/templates
            data: data,
            branding: { logo: "Pastelería La Fiesta", primaryColor: "#e91e63" }
        });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="reporte_profesional.pdf"');
        return res.status(200).send(buffer);

    } catch (error) {
        console.error("Professional PDF Error:", error);
        return res.status(500).json({ message: "Error al generar PDF profesional", error: error.message });
    }
};

// 2. Backend with PDFKit (High speed / Lightweight)
exports.generateFastPdf = async (req, res) => {
    try {
        const data = {
            title: "Listado Rápido de Inventario",
            subtitle: "Generado automáticamente por el servidor",
            items: [
                { SKU: "P001", Producto: "Harina 1kg", Stock: "50" },
                { SKU: "P002", Producto: "Azúcar 1kg", Stock: "30" },
                { SKU: "P003", Producto: "Huevos x30", Stock: "15" }
            ],
            footer: "Pastelería La Fiesta - Sistema Interno"
        };

        // We use PDFKit for speed and low server load
        const buffer = await renderSimplePdf(data);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="inventario_rapido.pdf"');
        return res.status(200).send(buffer);

    } catch (error) {
        console.error("Fast PDF Error:", error);
        return res.status(500).json({ message: "Error al generar PDF rápido", error: error.message });
    }
};

// Note: The "Frontend" path is implemented in the React application
// using html2pdf.js via the generatePdfFromDom utility.
