const { CashCut, Folio } = require('../models');
const { Op } = require('sequelize');
const nodemailer = require('nodemailer');
const pdfService = require('./pdfService');

function ymd(d) {
    return new Date(d).toISOString().split('T')[0];
}

/**
 * Process and send the Daily Cash Cut email.
 * Implements deduplication: checks if email was already sent for this date using the CashCut record.
 * @param {Object} params
 * @param {string} params.date - YYYY-MM-DD
 * @param {Array<string>} [params.branches] - List of branch names
 * @param {string} [params.email] - Recipient email override
 * @param {number} [params.userId] - ID of user triggering the action (if any)
 * @param {Object} [params.tenantFilter] - Sequelize filter for tenant scoping
 */
async function processDailyCutEmail({ date, branches = [], email, userId, tenantFilter = {} }) {
    const targetDate = date ? ymd(date) : ymd(new Date());
    const recipient = email || process.env.DAILY_CASH_CUT_EMAIL_TO || 'mariomoguel05@gmail.com';

    console.log(`[DailyCut] Processing email for ${targetDate} to ${recipient}...`);

    let cut;
    try {
        // 1. Find or Create CashCut record to track status
        [cut] = await CashCut.findOrCreate({
            where: { date: targetDate },
            defaults: {
                status: 'Open',
                totalIncome: 0,
                totalExpense: 0,
                finalBalance: 0,
                createdByUserId: userId || null,
                emailStatus: 'PENDING'
            }
        });

        // 2. Deduplication Check
        if (cut.emailStatus === 'SENT') {
            console.log(`[DailyCut] Skipping email for ${targetDate}: Already SENT.`);
            return { ok: true, message: 'Correo ya enviado previamente.', skipped: true };
        }

    } catch (dbError) {
        console.warn("[DailyCut] DB Error finding/creating record, proceeding without dedupe persistence:", dbError.message);
    }

    // 3. Gather Data
    try {
        const folios = await Folio.findAll({
            where: {
                fecha_entrega: targetDate,
                estatus_folio: { [Op.ne]: 'Cancelado' },
                ...tenantFilter
            },
            order: [['hora_entrega', 'ASC']],
        });

        // 4. Generate PDF
        const pdfBuffer = await pdfService.renderOrdersPdf({
            folios: folios.map(f => f.toJSON()),
            date: targetDate,
            branches,
        });

        // 5. Send Email
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT || 587),
            secure: false, // true for 465, false for other ports
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            },
        });

        // 5.1 Verify Connection
        try {
            await transporter.verify();
            console.log('[DailyCut] SMTP Connection Verified');
        } catch (smtpError) {
            console.error('[DailyCut] SMTP Verify Error:', smtpError);
            const msg = smtpError.code === 'EAUTH'
                ? 'Error de autenticación SMTP. Revise usuario/contraseña.'
                : `Error de conexión SMTP: ${smtpError.message}`;
            throw new Error(msg);
        }

        await transporter.sendMail({
            from: process.env.SMTP_FROM || process.env.SMTP_USER,
            to: recipient,
            subject: `Corte del día - ${targetDate}`,
            text:
                `Corte del día ${targetDate}\n` +
                `Sucursales: ${branches.length ? branches.join(', ') : '(no especificadas)'}\n` +
                `Total pedidos: ${folios.length}\n`,
            attachments: [{ filename: `corte-${targetDate}.pdf`, content: pdfBuffer }],
        });

        // 6. Update Status Success
        if (cut) {
            await cut.update({
                emailStatus: 'SENT',
                emailTo: recipient,
                emailError: null
            });
        }

        console.log(`[DailyCut] Email successfully sent to ${recipient}`);
        return { ok: true, message: `Enviado a ${recipient}` };

    } catch (error) {
        console.error(`[DailyCut] Failed to send email:`, error);

        // 7. Update Status Failure
        if (cut) {
            await cut.update({
                emailStatus: 'FAILED',
                emailTo: recipient,
                emailError: error.message
            });
        }

        return { ok: false, message: 'Error enviando correo', error: error.message };
    }
}

module.exports = {
    processDailyCutEmail
};
