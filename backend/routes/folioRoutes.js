const express = require('express');
const router = express.Router();
const folioController = require('../controllers/folioController');
const authMiddleware = require('../middleware/authMiddleware');
const tenantScope = require('../middleware/tenantScope');

const uploadReference = require('../middleware/uploadReference');

router.use(authMiddleware);
router.use(tenantScope);

// ✅ Primero rutas estáticas
router.get('/stats/dashboard', folioController.getDashboardStats);
router.get('/calendar', folioController.getCalendarEvents);

// Detail specific route (reusing getFolioById logic)
router.get('/:id/calendar-detail', folioController.getFolioById);

// ✅ CRUD
router.get('/', folioController.listFolios);

// Day Summary Routes
router.get('/resumen-dia', folioController.getDaySummary);
router.get('/pdf/comandas/:date', folioController.downloadComandasPdf);
router.get('/pdf/etiquetas/:date', folioController.downloadEtiquetasPdf);

router.post('/', uploadReference.array('referenceImages', 5), folioController.createFolio);

router.get('/:id/pdf', folioController.generarPDF);
router.get('/:id/label-pdf', folioController.generarEtiqueta); // Nueva ruta

// New PDF Service Routes
const folioPdfController = require('../controllers/folioPdfController');

/**
 * @swagger
 * /api/folios/{id}/pdf/comanda:
 *   get:
 *     summary: Descargar Comanda PDF
 *     tags: [Folios]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Archivo PDF
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *
 * /api/folios/{id}/pdf/nota:
 *   get:
 *     summary: Descargar Nota de Venta PDF
 *     tags: [Folios]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Archivo PDF
 */
router.get('/:id/pdf/comanda', folioController.generarPDF);
router.get('/:id/pdf/nota', folioController.generarPDF);
router.get('/:id', folioController.getFolioById);
router.put('/:id', uploadReference.array('referenceImages', 5), folioController.updateFolio);

router.patch('/:id/cancel', folioController.cancelFolio);
router.delete('/:id', folioController.deleteFolio);

// Status update specific route
router.patch('/:id/status', folioController.updateFolioStatus);

module.exports = router;