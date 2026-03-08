const express = require('express');
const router = express.Router();
const cashController = require('./cash.controller');
const authMiddleware = require('../../../middleware/authMiddleware');
const checkRole = require('../../../middleware/checkRole');

// Roles permitidos para operaciones críticas
const ADMIN_ROLES = ['OWNER', 'ADMIN', 'SUPER_ADMIN'];

router.use(authMiddleware);

/**
 * @swagger
 * /api/v1/cash/summary:
 *   get:
 *     summary: Obtener resumen diario de caja
 *     tags: [Cash]
 */
router.get('/summary', cashController.getDailySummary);

/**
 * @swagger
 * /api/v1/cash/movement:
 *   post:
 *     summary: Agregar movimiento de caja (Ingreso/Egreso)
 *     tags: [Cash]
 */
router.post('/movement', checkRole(ADMIN_ROLES), cashController.addMovement);

/**
 * @swagger
 * /api/v1/cash/close:
 *   post:
 *     summary: Cerrar caja del día
 *     tags: [Cash]
 */
router.post('/close', checkRole(ADMIN_ROLES), cashController.closeDay);

module.exports = router;
