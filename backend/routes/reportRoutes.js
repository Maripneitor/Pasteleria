const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.post('/daily-cut', reportController.sendDailyCut);
router.get('/daily-cut/preview', reportController.previewDailyCut);

module.exports = router;
