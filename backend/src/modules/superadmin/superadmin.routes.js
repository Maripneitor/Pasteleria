const express = require('express');
const router = express.Router();
const superAdminController = require('./superadmin.controller');
const authMiddleware = require('../../../middleware/authMiddleware');
const checkRole = require('../../../middleware/checkRole');

router.use(authMiddleware);
router.use(checkRole(['SUPER_ADMIN']));

router.get('/saas/ledger', superAdminController.getLedger);
router.get('/saas/alerts', superAdminController.getAlerts);
router.get('/global-stats', superAdminController.getGlobalStats);
router.get('/audit-log', superAdminController.getGlobalAuditLog);
router.get('/tenants', superAdminController.getTenantList);
router.put('/tenants/:id/limit', superAdminController.updateTenantLimit);

module.exports = router;
