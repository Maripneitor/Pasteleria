const { User, Folio, AuditLog, Tenant, Branch, sequelize } = require('../models');
const { Op } = require('sequelize');
const { sendEmail } = require('./emailService');
const { format, startOfDay, endOfDay } = require('date-fns');

const RECIPIENT = process.env.SYSTEM_REPORTS_TO || 'mariomoguel05@gmail.com';

/**
 * Reporte Diario de Actividad
 * Resume folios creados, ingresos estimados y nuevos usuarios.
 */
async function generateActivityReport() {
    try {
        const today = new Date();
        const start = startOfDay(today);
        const end = endOfDay(today);

        const createdFolios = await Folio.count({ where: { createdAt: { [Op.between]: [start, end] } } });
        const totalSales = await Folio.sum('total', {
            where: {
                createdAt: { [Op.between]: [start, end] },
                estatus_folio: 'Activo'
            }
        }) || 0;
        const newUsers = await User.count({ where: { createdAt: { [Op.between]: [start, end] } } });

        const html = `
            <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px;">
                <h2 style="color: #ec4899; text-align: center;">📊 Reporte Diario de Actividad</h2>
                <hr/>
                <p><strong>Fecha:</strong> ${format(today, 'dd/MM/yyyy')}</p>
                <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px;">
                    <ul style="list-style: none; padding: 0;">
                        <li style="margin-bottom: 10px;">📦 <strong>Folios Creados:</strong> ${createdFolios}</li>
                        <li style="margin-bottom: 10px;">💰 <strong>Ventas Totales (Aprox):</strong> $${parseFloat(totalSales).toFixed(2)}</li>
                        <li style="margin-bottom: 10px;">👤 <strong>Nuevos Usuarios:</strong> ${newUsers}</li>
                    </ul>
                </div>
                <p style="color: #6b7280; font-size: 12px; margin-top: 20px; text-align: center;">Este es un reporte automático generado por el sistema.</p>
            </div>
        `;

        await sendEmail({
            to: RECIPIENT,
            subject: `[Actividad] Reporte Diario - ${format(today, 'dd/MM/yyyy')}`,
            html
        });
        console.log("✅ Activity report sent to", RECIPIENT);
    } catch (error) {
        console.error("❌ Error generating activity report:", error);
    }
}

/**
 * Reporte de Errores del Sistema
 * Escanea AuditLog en busca de fallos o alertas manuales.
 */
async function generateErrorReport() {
    try {
        const today = new Date();
        const start = startOfDay(today);
        const end = endOfDay(today);

        const logs = await AuditLog.findAll({
            where: {
                createdAt: { [Op.between]: [start, end] },
                [Op.or]: [
                    { action: { [Op.like]: '%FAIL%' } },
                    { action: { [Op.like]: '%ERROR%' } },
                    { meta: { [Op.like]: '%error%' } }
                ]
            },
            include: [{ model: User, as: 'actor', attributes: ['name', 'email'] }],
            limit: 50,
            order: [['createdAt', 'DESC']]
        });

        if (logs.length === 0) {
            console.log("ℹ️ No system errors to report today.");
            return;
        }

        let rows = logs.map(l => {
            let metaStr = "{}";
            try {
                metaStr = JSON.stringify(l.meta, null, 2);
            } catch (e) { }

            return `
                <tr>
                    <td style="border-bottom: 1px solid #ddd; padding: 8px;">${format(l.createdAt, 'HH:mm')}</td>
                    <td style="border-bottom: 1px solid #ddd; padding: 8px; color: #dc2626; font-weight: bold;">${l.action}</td>
                    <td style="border-bottom: 1px solid #ddd; padding: 8px;">${l.entity}</td>
                    <td style="border-bottom: 1px solid #ddd; padding: 8px;">${l.actor ? l.actor.name : 'System'}</td>
                    <td style="border-bottom: 1px solid #ddd; padding: 8px;"><pre style="font-size: 10px; background: #f4f4f4; padding: 5px;">${metaStr}</pre></td>
                </tr>
            `;
        }).join('');

        const html = `
            <div style="font-family: sans-serif;">
                <h2 style="color: #dc2626;">🚨 Alertas de Errores del Sistema</h2>
                <p>Se detectaron <strong>${logs.length}</strong> eventos sospechosos hoy.</p>
                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="background-color: #f3f4f6; text-align: left;">
                            <th style="padding: 8px;">HH:mm</th>
                            <th style="padding: 8px;">Acción</th>
                            <th style="padding: 10px;">Entidad</th>
                            <th style="padding: 10px;">Actor</th>
                            <th style="padding: 10px;">Metadata</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rows}
                    </tbody>
                </table>
            </div>
        `;

        await sendEmail({
            to: RECIPIENT,
            subject: `[Errores] Reporte del Sistema - ${format(today, 'dd/MM/yyyy')} (${logs.length} alertas)`,
            html
        });
        console.log("✅ Error report sent to", RECIPIENT);
    } catch (error) {
        console.error("❌ Error generating error report:", error);
    }
}

/**
 * Reporte de Uso por Sucursal
 * Agregados de folios y ventas acumuladas por sucursal.
 */
async function generateBranchUsageReport() {
    try {
        const stats = await Folio.findAll({
            attributes: [
                'branchId',
                [sequelize.fn('COUNT', sequelize.col('Folio.id')), 'orderCount'],
                [sequelize.fn('SUM', sequelize.col('total')), 'earnings']
            ],
            where: { estatus_folio: 'Activo' },
            group: ['branchId'],
            include: [{ model: Branch, as: 'branch', attributes: ['name'] }]
        });

        let rows = stats.map(s => `
            <tr>
                <td style="border-bottom: 1px solid #ddd; padding: 12px;">${s.branch ? s.branch.name : '<i>Sin Sucursal</i>'}</td>
                <td style="border-bottom: 1px solid #ddd; padding: 12px; text-align: center;">${s.get('orderCount')}</td>
                <td style="border-bottom: 1px solid #ddd; padding: 12px; text-align: right; color: #059669; font-weight: bold;">$${parseFloat(s.get('earnings') || 0).toFixed(2)}</td>
            </tr>
        `).join('');

        const html = `
            <div style="font-family: sans-serif; max-width: 600px; margin: auto;">
                <h2 style="color: #2563eb; text-align: center;">🏢 Reporte de Uso por Sucursal</h2>
                <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                    <thead style="background-color: #2563eb; color: white;">
                        <tr>
                            <th style="padding: 12px; text-align: left;">Sucursal</th>
                            <th style="padding: 12px; text-align: center;">Pedidos</th>
                            <th style="padding: 12px; text-align: right;">Ingresos Totales</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rows}
                    </tbody>
                </table>
                <p style="margin-top: 20px; font-size: 12px; color: #6b7280;">Estadísticas calculadas en base a folios activos históricos.</p>
            </div>
        `;

        await sendEmail({
            to: RECIPIENT,
            subject: `[Sucursales] Resumen de Uso - ${format(new Date(), 'dd/MM/yyyy')}`,
            html
        });
        console.log("✅ Branch usage report sent to", RECIPIENT);
    } catch (error) {
        console.error("❌ Error generating branch usage report:", error);
    }
}

async function sendManualTestReports() {
    console.log("🚀 Manual trigger: Sending system snapshots...");
    await generateActivityReport();
    await generateBranchUsageReport();
    await generateErrorReport();
    return { ok: true, message: "Reports sent to " + RECIPIENT };
}

module.exports = {
    generateActivityReport,
    generateErrorReport,
    generateBranchUsageReport,
    sendManualTestReports
};
