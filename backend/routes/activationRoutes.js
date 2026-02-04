const express = require('express');
const router = express.Router();
const activationController = require('../controllers/activationController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/generate', authMiddleware, activationController.generateCode);
router.post('/verify', authMiddleware, activationController.verifyCode);

module.exports = router;
