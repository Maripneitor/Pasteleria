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
async function processDailyCutEmail({ date, branches = [], email, userId, tenantFilter = {}, force = false }) {
    const targetDate = date ? ymd(date) : ymd(new Date());

    // Recipients Logic
    // 1. Explicit override (email arg)
    // 2. ENV List (ADMIN_REPORT_RECIPIENTS)
    // 3. Fallback (DAILY_CASH_CUT_EMAIL_TO)
    // 4. Fallback hardcoded
    let recipientsList = [];
    if (email) {
        recipientsList = [email];
    } else if (process.env.ADMIN_REPORT_RECIPIENTS) {
        recipientsList = process.env.ADMIN_REPORT_RECIPIENTS.split(',').map(e => e.trim()).filter(Boolean);
    } else {
        recipientsList = [(process.env.DAILY_CASH_CUT_EMAIL_TO || 'mariomoguel05@gmail.com')];
    }

    // Dedupe empty
    recipientsList = [...new Set(recipientsList)];
    const recipientsStr = recipientsList.join(',');

    if (recipientsList.length === 0) {
        return { ok: false, message: 'No hay destinatarios configurados.' };
    }

    console.log(`[DailyCut] Processing email for ${targetDate}. Recipients: ${recipientsStr}. Force: ${force}`);

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
        if (!force && cut.emailStatus === 'SENT') {
            console.log(`[DailyCut] Skipping email for ${targetDate}: Already SENT.`);
            return { ok: true, message: `El reporte del ${targetDate} ya fue enviado previamente.`, skipped: true };
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
        // Optimization: Verify only once or proceed with send logic to catch error there
        // await transporter.verify(); 

        await transporter.sendMail({
            from: process.env.SMTP_FROM || process.env.SMTP_USER,
            to: recipientsStr, // Nodemailer accepts "a@a.com, b@b.com"
            subject: `Corte del día - ${targetDate} ${force ? '(Reenvío)' : ''}`,
            text:
                `Corte del día ${targetDate}\n` +
                `Generado por: ${userId ? 'Usuario ' + userId : 'Sistema'}\n` +
                `Total pedidos: ${folios.length}\n`,
            attachments: [{ filename: `corte-${targetDate}.pdf`, content: pdfBuffer }],
        });

        // 6. Update Status Success
        if (cut) {
            await cut.update({
                emailStatus: 'SENT',
                emailTo: recipientsStr,
                emailError: null
            });
        }

        console.log(`[DailyCut] Email successfully sent to ${recipientsStr}`);
        return { ok: true, message: `Enviado a ${recipientsList.length} destinatarios.` };

    } catch (error) {
        console.error(`[DailyCut] Failed to send email:`, error);

        // 7. Update Status Failure
        if (cut) {
            await cut.update({
                emailStatus: 'FAILED',
                emailTo: recipientsStr,
                emailError: error.message
            });
        }

        return { ok: false, message: 'Error enviando correo', error: error.message };
    }
}

/**
 * Generic function to send a report email with attachment.
 */
async function sendReportEmail({ subject, text, filename, content, recipients }) {
    // Recipients Logic
    let recipientsList = [];
    if (recipients) {
        recipientsList = Array.isArray(recipients) ? recipients : recipients.split(',').map(e => e.trim());
    } else if (process.env.ADMIN_REPORT_RECIPIENTS) {
        recipientsList = process.env.ADMIN_REPORT_RECIPIENTS.split(',').map(e => e.trim()).filter(Boolean);
    } else {
        recipientsList = [(process.env.DAILY_CASH_CUT_EMAIL_TO || 'mariomoguel05@gmail.com')];
    }

    // Dedupe
    const recipientsStr = [...new Set(recipientsList)].join(',');

    if (!recipientsStr) {
        throw new Error('No recipients configured');
    }

    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: false,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        },
    });

    await transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: recipientsStr,
        subject: subject,
        text: text,
        attachments: [{ filename, content }],
    });

    return { ok: true, recipients: recipientsStr };
}

module.exports = {
    processDailyCutEmail,
    sendReportEmail
};
