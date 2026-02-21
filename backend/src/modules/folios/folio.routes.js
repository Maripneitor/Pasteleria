const express = require('express');
const router = express.Router();
const folioController = require('./folio.controller');
const authMiddleware = require('../../../middleware/authMiddleware');
const tenantScope = require('../../../middleware/tenantScope');
const uploadReference = require('../../../middleware/uploadReference');
const validateRequest = require('../../../middleware/validate');
const { createFolioSchema, updateFolioSchema } = require('../../../schemas/folioSchema');

// Protected Routes
router.use(authMiddleware);
router.use(tenantScope);

// ✅ Stats & Calendar
router.get('/stats/dashboard', folioController.getDashboardStats);
router.get('/calendar', folioController.getCalendarEvents);
router.get('/resumen-dia', folioController.getDaySummary);

// ✅ PDF Day Summaries
router.get('/pdf/comandas/:date', folioController.downloadComandasPdf);
router.get('/pdf/etiquetas/:date', folioController.downloadEtiquetasPdf);

// ✅ Folio Specific PDFs
router.get('/:id/pdf/comanda', folioController.getFolioComandaPdf);
router.get('/:id/pdf/nota', folioController.getFolioNotaPdf);
router.get('/:id/pdf', folioController.generarPDF);
router.get('/:id/label-pdf', folioController.generarEtiqueta);

// ✅ CRUD Operations
router.get('/', folioController.listFolios);
router.post('/', uploadReference.array('referenceImages', 5), validateRequest(createFolioSchema), folioController.createFolio);
router.get('/:id', folioController.getFolioById);
router.put('/:id', uploadReference.array('referenceImages', 5), validateRequest(updateFolioSchema), folioController.updateFolio);
router.patch('/:id/cancel', folioController.cancelFolio);
router.patch('/:id/status', folioController.updateFolioStatus);
router.delete('/:id', folioController.deleteFolio);

module.exports = router;
