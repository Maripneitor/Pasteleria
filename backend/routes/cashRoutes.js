const express = require('express');
const router = express.Router();
const cashController = require('../controllers/cashController');
const authMiddleware = require('../middleware/authMiddleware');

const checkRole = require('../middleware/checkRole');

router.use(authMiddleware);

router.get('/summary', cashController.getDailySummary);
router.post('/movement', checkRole(['OWNER', 'ADMIN', 'SUPER_ADMIN']), cashController.addMovement);
router.post('/close', checkRole(['OWNER', 'ADMIN', 'SUPER_ADMIN']), cashController.closeDay);

module.exports = router;
