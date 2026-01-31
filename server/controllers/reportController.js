const { CashCut, Folio } = require('../models');
const { Op } = require('sequelize');
const nodemailer = require('nodemailer');
const pdfService = require('../services/pdfService');

function ymd(d) {
    return new Date(d).toISOString().split('T')[0];
}

exports.sendDailyCut = async (req, res) => {
    try {
        const date = req.body?.date ? ymd(req.body.date) : ymd(new Date());
        const branches = Array.isArray(req.body?.branches) ? req.body.branches : [];

        // 1) SIEMPRE guardamos el corte primero (si tienes el modelo CashCut)
        let cut;
        try {
            cut = await CashCut.create({
                date,
                branches: branches.length ? JSON.stringify(branches) : null,
                createdByUserId: req.user?.id || null,
                status: 'CREATED',
            });
        } catch (dbError) {
            console.warn("Could not create CashCut record (table might be missing), proceeding with email...", dbError.message);
        }

        // 2) Traer folios del día
        const folios = await Folio.findAll({
            where: { fecha_entrega: date, estatus_folio: { [Op.ne]: 'Cancelado' } },
            order: [['hora_entrega', 'ASC']],
        });

        // 3) Generar PDF (aunque esté vacío)
        const pdfBuffer = await pdfService.renderOrdersPdf({
            folios: folios.map(f => f.toJSON()),
            date,
            branches,
        });

        // 4) Intentar correo (si falla, NO rompe el corte)
        const to = req.body?.email || 'Mariomoguel05@gmail.com';

        let emailStatus = 'SENT';
        let emailError = null;

        try {
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
                to,
                subject: `Corte del día - ${date}`,
                text:
                    `Corte del día ${date}\n` +
                    `Sucursales: ${branches.length ? branches.join(', ') : '(no especificadas)'}\n` +
                    `Total pedidos: ${folios.length}\n`,
                attachments: [{ filename: `corte-${date}.pdf`, content: pdfBuffer }],
            });
        } catch (err) {
            emailStatus = 'FAILED';
            emailError = err?.message || 'Error enviando correo';
            console.error("Email failed:", emailError);
        }

        // 5) Actualiza el corte con resultado del correo
        if (cut) {
            await CashCut.update(
                { status: emailStatus, emailTo: to, emailError },
                { where: { id: cut.id } }
            );
        }

        return res.json({
            ok: true,
            message:
                emailStatus === 'SENT'
                    ? 'Corte guardado y enviado.'
                    : 'Corte guardado. Falló el correo (reintentar).',
            cutId: cut?.id,
            emailStatus,
        });
    } catch (e) {
        console.error('dailyCut:', e);
        return res.status(500).json({ message: 'Error generando corte', error: e.message });
    }
};
