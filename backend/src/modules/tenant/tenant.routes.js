const express = require('express');
const router = express.Router();
const tenantConfigController = require('./tenant.controller');
const authMiddleware = require('../../../middleware/authMiddleware');
const checkRole = require('../../../middleware/checkRole');

router.use(authMiddleware);

// GET Config - Open to all authenticated users of the tenant
router.get('/config', tenantConfigController.getTenantConfig);

// PUT Config - Restricted to Owner/Admin
router.put('/config', checkRole(['OWNER', 'ADMIN', 'SUPER_ADMIN']), tenantConfigController.updateTenantConfig);

module.exports = router;
