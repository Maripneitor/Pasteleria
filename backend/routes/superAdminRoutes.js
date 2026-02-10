const express = require('express');
const router = express.Router();
const superAdminController = require('../controllers/superAdminController');
const authMiddleware = require('../middleware/authMiddleware');
const roleCheck = (role) => (req, res, next) => {
    if (req.user && req.user.role === role) return next();
    return res.status(403).json({ message: 'Forbidden' });
};

router.use(authMiddleware);
router.use(roleCheck('SUPER_ADMIN'));

router.get('/saas/ledger', superAdminController.getLedger);
router.get('/saas/alerts', superAdminController.getAlerts);

// New Global Reporting Routes
router.get('/global-stats', superAdminController.getGlobalStats);
router.get('/audit-log', superAdminController.getGlobalAuditLog);
router.get('/tenants', superAdminController.getTenantList);
router.put('/tenants/:id/limit', superAdminController.updateTenantLimit);

module.exports = router;
