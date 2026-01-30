const express = require('express');
const router = express.Router();
const cashController = require('../controllers/cashController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/summary', cashController.getDailySummary);
router.post('/movement', cashController.addMovement);
router.post('/close', cashController.closeDay);

module.exports = router;
