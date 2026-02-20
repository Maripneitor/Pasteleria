const express = require('express');
const router = express.Router();
const multer = require('multer');
const emailController = require('../controllers/emailController');
const authMiddleware = require('../middleware/authMiddleware');

// Configure multer for memory storage
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

// All accounting routes require authentication
router.use(authMiddleware);

/**
 * @route POST /api/accounting/enviar-reporte
 * @desc Envía un reporte PDF por correo electrónico
 * @access Private
 */
router.post('/enviar-reporte', upload.single('pdf'), emailController.sendBalanceEmail);

module.exports = router;
