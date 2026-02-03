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
router.get('/day-summary-pdf', folioController.generarResumenDia); // Nueva ruta (antes de /:id)
router.post('/', uploadReference.array('referenceImages', 5), folioController.createFolio);

router.get('/:id/pdf', folioController.generarPDF);
router.get('/:id/label-pdf', folioController.generarEtiqueta); // Nueva ruta
router.get('/:id', folioController.getFolioById);
router.put('/:id', uploadReference.array('referenceImages', 5), folioController.updateFolio);

router.patch('/:id/cancel', folioController.cancelFolio);
router.delete('/:id', folioController.deleteFolio);

// Status update specific route
router.patch('/:id/status', folioController.updateFolioStatus);

module.exports = router;