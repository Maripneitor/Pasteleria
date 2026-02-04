const express = require('express');
const router = express.Router();
const auditController = require('../controllers/auditController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// Solo admin
router.get('/', authMiddleware, roleMiddleware(['ADMIN', 'Administrador']), auditController.getAuditLogs);

module.exports = router;
