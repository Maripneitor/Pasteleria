const express = require('express');
const router = express.Router();
const folioController = require('../controllers/folioController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

// ✅ Primero rutas estáticas
router.get('/stats/dashboard', folioController.getDashboardStats);
router.get('/calendar', folioController.getCalendarEvents);

// ✅ CRUD
router.get('/', folioController.listFolios);          // <<<< ESTO QUITA EL 404
router.post('/', folioController.createFolio);

router.get('/:id/pdf', folioController.generarPDF);
router.get('/:id', folioController.getFolioById);
router.put('/:id', folioController.updateFolio);

router.patch('/:id/cancel', folioController.cancelFolio);
router.delete('/:id', folioController.deleteFolio);

// Status update specific route
router.patch('/:id/status', folioController.updateFolioStatus);

module.exports = router;