const nodemailer = require('nodemailer');
const commissionService = require('./commissionService');

// Create reusable transporter object using the default SMTP transport
const createTransporter = () => {
    // If no ENV vars, this might fail or log error, which is expected behavior for "stub" if config missing
    if (!process.env.SMTP_HOST) {
        console.warn("[EmailOutbox] SMTP configuration missing. Email will not be sent.");
        return null;
    }

    return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT || 587,
        secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });
};

/**
 * Enqueues (currently just sends) a daily report email.
 * @param {Object} params
 * @param {string} params.date - Date for the report (YYYY-MM-DD)
 * @param {string} params.to - Recipient email
 */
const enqueueDailyReport = async ({ date, to }) => {
    try {
        console.log(`[EmailOutbox] Preparing report for ${date} to ${to}...`);

        // 1. Generate Report Data
        const report = await commissionService.getReport({ from: date, to: date });

        // 2. Format Body
        const htmlContent = `
            <h1>Reporte de Comisiones - ${date}</h1>
            <p><strong>Total Comisiones:</strong> $${report.totalCommissions}</p>
            <p><strong>Cobradas al Cliente:</strong> $${report.totalAppliedToCustomer}</p>
            <p><strong>Absorbidas (No Cobradas):</strong> $${report.totalNotApplied}</p>
            <p><strong>Total Operaciones:</strong> ${report.count}</p>
            <hr>
            <h3>Detalle</h3>
            <ul>
                ${report.details.map(d => `
                    <li> Folio ${d.folioNumber}: $${d.amount.toFixed(2)} (${d.appliedToCustomer ? 'Cobrado' : 'Absorbido'})</li>
                `).join('')}
            </ul>
        `;

        // 3. Send Email
        const transporter = createTransporter();

        if (!transporter) {
            return { success: false, message: "SMTP Config Missing" };
        }

        const info = await transporter.sendMail({
            from: process.env.SMTP_FROM || '"Sistema Pastelería" <noreply@pasteleria.com>',
            to: to,
            subject: `Reporte de Comisiones ${date}`,
            html: htmlContent,
        });

        console.log(`[EmailOutbox] Message sent: ${info.messageId}`);
        return { success: true, messageId: info.messageId };

    } catch (error) {
        console.error("[EmailOutbox] Error processing daily report:", error);
        // We do not throw to avoid crashing the trigger process, just return error status
        return { success: false, error: error.message };
    }
};

module.exports = {
    enqueueDailyReport
};
