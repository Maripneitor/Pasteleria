const express = require('express');
const router = express.Router();
const superAdminController = require('../controllers/superAdminController');
const authMiddleware = require('../middleware/authMiddleware');
const roleCheck = (role) => (req, res, next) => {
    if (req.user && req.user.role === role) return next();
    return res.status(403).json({ message: 'Forbidden' });
};

const checkRole = require('../middleware/checkRole');

router.use(authMiddleware);

router.get('/saas/ledger', checkRole(['SUPER_ADMIN']), superAdminController.getLedger);
router.get('/saas/alerts', checkRole(['SUPER_ADMIN']), superAdminController.getAlerts);

// New Global Reporting Routes
router.get('/stats', checkRole(['SUPER_ADMIN', 'ADMIN']), superAdminController.getGlobalStats);
router.get('/audit', checkRole(['SUPER_ADMIN', 'ADMIN']), superAdminController.getGlobalAuditLog);
router.get('/tenants', checkRole(['SUPER_ADMIN', 'ADMIN']), superAdminController.getTenantList);
router.put('/tenants/:id/limit', checkRole(['SUPER_ADMIN', 'ADMIN']), superAdminController.updateTenantLimit);

// Phase 4: Automated Reporting Triggers (Hidden)
const reportingService = require('../services/automatedReportingService');
router.post('/reports/test-trigger', checkRole(['SUPER_ADMIN']), async (req, res) => {
    try {
        const result = await reportingService.sendManualTestReports();
        res.json(result);
    } catch (error) {
        res.status(500).json({ ok: false, message: error.message });
    }
});

module.exports = router;
