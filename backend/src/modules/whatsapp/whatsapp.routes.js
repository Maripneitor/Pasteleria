const express = require('express');
const router = express.Router();
const whatsappController = require('./whatsapp.controller');
const authMiddleware = require('../../../middleware/authMiddleware');
const checkRole = require('../../../middleware/checkRole');
// --- WEBHOOK (Public/Gateway) ---
router.post('/webhook', whatsappController.handleWebhook);

// --- QR & BASIC SESSION (Admin only) ---
router.get('/qr', whatsappController.getQR);
router.post('/refresh', authMiddleware, checkRole(['ADMIN', 'SUPER_ADMIN']), whatsappController.refreshSession);

module.exports = router;
