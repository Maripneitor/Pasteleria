const Folio = require('../models/Folio');
const { Op } = require('sequelize');
const ejs = require('ejs');
const path = require('path');
const puppeteer = require('puppeteer');
const QRCode = require('qrcode');

const FolioEditHistory = require('../models/FolioEditHistory'); // Asegúrate de importar el modelo

// 1. Crear Nuevo Folio
exports.createFolio = async (req, res) => {
    try {
        const { clientId, ...folioData } = req.body;

        // Validación básica
        if (!clientId) {
            return res.status(400).json({ success: false, message: 'El cliente es obligatorio' });
        }

        // Asignar responsable (Usuario logueado)
        const responsibleUserId = req.user ? req.user.id : null;

        const nuevoFolio = await Folio.create({
            ...folioData,
            clientId,
            responsibleUserId
        });

        // Registrar creación en historial
        await FolioEditHistory.create({
            tenantId: req.user?.tenantId || 1, // Asumiendo multi-tenant o default 1
            folioId: nuevoFolio.id,
            editorUserId: responsibleUserId,
            eventType: 'CREATE',
            changedFields: { created: true }
        });

        res.status(201).json({
            success: true,
            message: 'Folio creado exitosamente',
            data: nuevoFolio
        });
    } catch (error) {
        console.error("Error al crear folio:", error);
        res.status(500).json({ success: false, message: 'Error al guardar el pedido' });
    }
};

// 1.5 Actualizar Folio con Auditoría
exports.updateFolio = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        const editorUserId = req.user ? req.user.id : null;

        const folio = await Folio.findByPk(id);
        if (!folio) {
            return res.status(404).json({ message: 'Folio no encontrado' });
        }

        // Detectar cambios para el historial
        const changes = {};
        Object.keys(updateData).forEach(key => {
            if (folio[key] != updateData[key]) {
                changes[key] = { old: folio[key], new: updateData[key] };
            }
        });

        // Actualizar
        await folio.update(updateData);

        // Guardar historial si hubo cambios significativos
        if (Object.keys(changes).length > 0) {
            await FolioEditHistory.create({
                tenantId: req.user?.tenantId || 1,
                folioId: folio.id,
                editorUserId: editorUserId,
                eventType: 'UPDATE',
                changedFields: changes
            });
        }

        res.json({ success: true, message: 'Folio actualizado', data: folio });

    } catch (error) {
        console.error("Error actualizando folio:", error);
        res.status(500).json({ success: false, message: 'Error al actualizar el folio' });
    }
};

// 1.8 KDS: Actualizar Estatus (Cocina)
exports.updateFolioStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // Nuevo estatus: 'Horneado', 'Decorado', etc.
        const editorUserId = req.user ? req.user.id : null;

        const folio = await Folio.findByPk(id);
        if (!folio) {
            return res.status(404).json({ message: 'Folio no encontrado' });
        }

        const oldStatus = folio.estatus_produccion;

        // Actualizamos estatus y responsable (quien lo movió)
        await folio.update({
            estatus_produccion: status,
            responsibleUserId: editorUserId
        });

        // Historial
        await FolioEditHistory.create({
            tenantId: req.user?.tenantId || 1,
            folioId: folio.id,
            editorUserId: editorUserId,
            eventType: 'STATUS_CHANGE',
            changedFields: {
                status: { old: oldStatus, new: status }
            }
        });

        res.json({ success: true, message: `Folio movido a ${status}`, data: folio });

    } catch (error) {
        console.error("Error actualizando estatus:", error);
        res.status(500).json({ success: false, message: 'Error al cambiar estatus' });
    }
};

// 2. Estadísticas para el Dashboard
exports.getDashboardStats = async (req, res) => {
    try {
        // Mockup inteligente: En producción haríamos un count() real sobre los campos JSON
        // Por ahora devolvemos datos calculados básicos

        const totalFolios = await Folio.count();
        const ventasHoy = await Folio.sum('total', {
            where: { createdAt: { [Op.gt]: new Date(new Date() - 24 * 60 * 60 * 1000) } }
        });

        res.json({
            populares: [
                { name: 'Chocolate', value: 45 },
                { name: 'Vainilla', value: 30 },
                { name: 'Red Velvet', value: 25 },
            ],
            comisiones: [
                { name: 'Juan', comision: 1200 },
                { name: 'Ana', comision: 950 },
            ],
            resumen: {
                total_folios: totalFolios,
                ventas_hoy: ventasHoy || 0
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Error obteniendo estadísticas' });
    }
};

// 3. Generar PDF del Folio
exports.generarPDF = async (req, res) => {
    try {
        const { id } = req.params;
        const folio = await Folio.findByPk(id);

        if (!folio) {
            return res.status(404).json({ message: 'Folio no encontrado' });
        }

        // Generar QR Code
        const qrUrl = await QRCode.toDataURL(`http://localhost:5173/folios/${id}`); // Ajustar URL real

        // Renderizar EJS a HTML
        const filePath = path.join(__dirname, '../templates/folio-pdf.ejs');
        const html = await ejs.renderFile(filePath, { folio, qrCode: qrUrl });

        // Iniciar Puppeteer
        const browser = await puppeteer.launch({
            args: ['--no-sandbox', '--disable-setuid-sandbox'] // Vital para Docker
        });
        const page = await browser.newPage();

        await page.setContent(html, { waitUntil: 'networkidle0' });
        const pdfBuffer = await page.pdf({
            format: 'A4',
            margin: { top: '2cm', right: '2cm', bottom: '2cm', left: '2cm' },
            printBackground: true
        });

        await browser.close();

        // Enviar PDF
        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename=folio-${id}.pdf`,
            'Content-Length': pdfBuffer.length
        });
        res.send(pdfBuffer);

    } catch (error) {
        console.error("Error generando PDF:", error);
        res.status(500).json({ message: 'Error al generar el PDF' });
    }
};

exports.getCalendarEvents = async (req, res) => {
    try {
        const { start, end } = req.query; // Esperamos formato YYYY-MM-DD

        const folios = await Folio.findAll({
            where: {
                fecha_entrega: {
                    [Op.between]: [start, end]
                }
            },
            attributes: ['id', 'fecha_entrega', 'hora_entrega', 'cliente_nombre', 'tipo_folio', 'estatus_produccion'],
            order: [['hora_entrega', 'ASC']]
        });

        res.json(folios);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error obteniendo calendario' });
    }
};