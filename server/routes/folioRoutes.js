const express = require('express');
const router = express.Router();
const folioController = require('../controllers/folioController');
const authMiddleware = require('../middleware/authMiddleware'); // Asumiendo que tienes auth

router.post('/', authMiddleware, folioController.createFolio);
router.get('/stats/dashboard', authMiddleware, folioController.getDashboardStats); // Nueva ruta stats
router.get('/calendar', authMiddleware, folioController.getCalendarEvents); // Nueva ruta para obtener eventos del calendario
router.get('/:id/pdf', authMiddleware, folioController.generarPDF); // Ruta para descargar PDF
router.patch('/:id/status', authMiddleware, folioController.updateFolioStatus); // KDS Status Update

module.exports = router;