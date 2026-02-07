const express = require('express');
const router = express.Router();
const tenantConfigController = require('../controllers/tenantConfigController');
const authMiddleware = require('../middleware/authMiddleware');
const checkRole = require('../middleware/checkRole');

router.use(authMiddleware);

// GET Config - Open to all authenticated users of the tenant
/**
 * @swagger
 * /api/tenant/config:
 *   get:
 *     summary: Obtener configuración del Tenant
 *     tags: [Tenant]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Configuración actual o defaults
 *   put:
 *     summary: Actualizar configuración del Tenant
 *     tags: [Tenant]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               businessName:
 *                 type: string
 *               primaryColor:
 *                 type: string
 *                 example: "#FF5733"
 *               footerText:
 *                 type: string
 *               logoUrl:
 *                 type: string
 *     responses:
 *       200:
 *         description: Configuración actualizada
 *       400:
 *         description: Error de validación (color, url)
 */
router.get('/config', tenantConfigController.getTenantConfig);

// PUT Config - Restricted to Owner/Admin
router.put('/config', checkRole(['OWNER', 'ADMIN', 'SUPER_ADMIN']), tenantConfigController.updateTenantConfig);

module.exports = router;
