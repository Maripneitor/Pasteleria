const cron = require('node-cron');
const { Op } = require('sequelize');
const { Commission, Folio } = require('./models');
const pdfService = require('./services/pdfService');
const { sendEmailWithAttachment } = require('./services/emailService');
const { format, subDays } = require('date-fns');
const { processDailyCutEmail } = require('./services/dailyCutEmailService');

const initCronJobs = () => {
    console.log('🕒 Inicializando CronJobs...');

    // Tarea programada para ejecutarse todos los días a las 9:00 PM.
    cron.schedule('0 21 * * *', async () => {
        console.log('🕒 Ejecutando tarea programada: Generando y enviando reporte de comisiones...');

        try {
            const now = new Date();
            const reportDate = format(now, 'yyyy-MM-dd');

            // El final del periodo es hoy a las 8:30 PM
            const endOfPeriod = new Date(now);
            endOfPeriod.setHours(20, 30, 0, 0);

            // El inicio del periodo es ayer a las 8:31 PM
            const startOfPeriod = subDays(endOfPeriod, 1);
            startOfPeriod.setSeconds(startOfPeriod.getSeconds() + 1); // Empezamos un segundo después de las 8:30 de ayer

            const commissions = await Commission.findAll({
                include: [{ model: Folio, as: 'folio', attributes: ['folioNumber'] }],
                where: {
                    createdAt: {
                        [Op.between]: [startOfPeriod, endOfPeriod]
                    }
                },
                order: [['createdAt', 'ASC']]
            });

            const pdfBuffer = await pdfService.createCommissionReportPdf(commissions, reportDate);

            const subject = `Reporte de Comisiones - ${format(now, 'dd/MM/yyyy')}`;
            const text = `Adjunto encontrarás el reporte de comisiones para el día de trabajo que finalizó a las 8:30 PM.`;
            const filename = `ReporteComisiones_${reportDate}.pdf`;

            const recipient = process.env.COMMISSIONS_REPORT_EMAIL_TO || 'mariomoguel05@gmail.com';
            await sendEmailWithAttachment(recipient, subject, text, pdfBuffer, filename);

        } catch (error) {
            console.error('❌ Error en la tarea programada de comisiones:', error);
        }
    }, {
        scheduled: true,
        timezone: "America/Mexico_City"
    });

    // Tarea: Enviar Corte Diario a las 9:05 PM (Redundancia)
    // Se enviará a mariomoguel05@gmail.com (o ENV) si no se ha enviado por cierre de caja.
    cron.schedule('5 21 * * *', async () => {
        console.log('🕒 Ejecutando tarea programada: Corte de caja diario...');
        try {
            await processDailyCutEmail({
                // Fecha actual
                // Nota: processDailyCutEmail ya hace new Date() si no se pasa date.
            });
        } catch (e) {
            console.error('❌ Error tarea cron corte caja:', e);
        }
    }, {
        scheduled: true,
        timezone: "America/Mexico_City"
    });

    // Tarea de Limpieza: Elimina PDFs de FOLIOS_GENERADOS antiguos (> 30 días)
    // Se ejecuta cada Domingo a las 3:00 AM
    cron.schedule('0 3 * * 0', async () => {
        console.log('🧹 Eliminando PDFs antiguos (30 días)...');
        const fs = require('fs');
        const path = require('path');
        const directory = path.join(__dirname, 'FOLIOS_GENERADOS');

        if (!fs.existsSync(directory)) return;

        fs.readdir(directory, (err, files) => {
            if (err) return console.error("Error leyendo directorio de folios:", err);

            files.forEach(file => {
                const filePath = path.join(directory, file);
                fs.stat(filePath, (err, stats) => {
                    if (err) return;

                    const now = new Date().getTime();
                    // 30 días de retención garantizada
                    const endTime = new Date(stats.mtime).getTime() + (30 * 24 * 60 * 60 * 1000);

                    if (now > endTime) {
                        fs.unlink(filePath, (err) => {
                            if (err) return console.error(`Error borrando ${file}`, err);
                            console.log(`🗑️ Archivo borrado por política de retención (30 días): ${file}`);
                        });
                    }
                });
            });
        });
    });
};

module.exports = initCronJobs;