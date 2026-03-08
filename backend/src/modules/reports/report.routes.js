const express = require('express');
const router = express.Router();
const reportController = require('./report.controller');
const authMiddleware = require('../../../middleware/authMiddleware');
const checkRole = require('../../../middleware/checkRole');

const FINANCE_ROLES = ['OWNER', 'ADMIN', 'SUPER_ADMIN'];

router.use(authMiddleware);

/**
 * @swagger
 * /api/v1/reports/daily-cut:
 *   post:
 *     summary: Enviar corte diario por email
 *     tags: [Reports]
 */
router.post('/daily-cut', checkRole(FINANCE_ROLES), reportController.sendDailyCut);

/**
 * @swagger
 * /api/v1/reports/daily-cut/preview:
 *   get:
 *     summary: Vista previa del corte diario (PDF)
 *     tags: [Reports]
 */
router.get('/daily-cut/preview', checkRole(FINANCE_ROLES), reportController.previewDailyCut);

module.exports = router;
