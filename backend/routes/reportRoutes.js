const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const authMiddleware = require('../middleware/authMiddleware');

const checkRole = require('../middleware/checkRole');

router.use(authMiddleware);

// Reportes Financieros: Solo Dueños/Admins
const FINANCE_ROLES = ['OWNER', 'ADMIN', 'SUPER_ADMIN'];

router.post('/daily-cut', checkRole(FINANCE_ROLES), reportController.sendDailyCut);
router.get('/daily-cut/preview', checkRole(FINANCE_ROLES), reportController.previewDailyCut);

module.exports = router;
