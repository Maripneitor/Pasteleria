const express = require('express');
const router = express.Router();
const commissionController = require('./commission.controller');
const authMiddleware = require('../../../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/report', commissionController.getReport);
router.get('/report/pdf', commissionController.getReportPdf);
router.post('/record', commissionController.recordCommission);
router.post('/trigger-report', commissionController.triggerReport);
router.post('/report/email', commissionController.sendReportEmail);

module.exports = router;
