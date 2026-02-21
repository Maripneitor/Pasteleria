const express = require('express');
const router = express.Router();
const auditController = require('./audit.controller');
const authMiddleware = require('../../../middleware/authMiddleware');
const checkRole = require('../../../middleware/checkRole');

// Solo admin y owner del tenant
router.get('/', authMiddleware, checkRole(['ADMIN', 'SUPER_ADMIN', 'OWNER', 'Administrador']), auditController.getAuditLogs);

module.exports = router;
