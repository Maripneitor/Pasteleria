const express = require('express');
const router = express.Router();
const whatsappController = require('../controllers/whatsappController');
const auth = require('../middleware/authMiddleware');
const role = require('../middleware/roleMiddleware');

// Admin Endpoints only
// Base URL: /api/whatsapp

// router.get('/status', auth, role(['ADMIN']), whatsappController.getStatus); // (Optional if you implement it)
// Public for <img> tag usage
router.get('/qr', whatsappController.getQR);
router.post('/refresh', auth, role(['ADMIN']), whatsappController.refreshSession);

module.exports = router;