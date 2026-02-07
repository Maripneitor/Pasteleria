const express = require('express');
const router = express.Router();
const branchController = require('../controllers/branchController');
const authMiddleware = require('../middleware/authMiddleware');
const tenantScope = require('../middleware/tenantScope');
const checkRole = require('../middleware/checkRole');

// All routes require Auth + Tenant
router.use(authMiddleware);
router.use(tenantScope);

// Roles allowed to Manage (Create/Update)
const MANAGE_ROLES = ['OWNER', 'ADMIN', 'SUPER_ADMIN'];
// Roles allowed to View (List) - Employee added conditionally in controller logic
const VIEW_ROLES = ['OWNER', 'ADMIN', 'SUPER_ADMIN', 'EMPLOYEE'];

// GET / - List
/**
 * @swagger
 * /api/branches:
 *   get:
 *     summary: Listar sucursales
 *     tags: [Branches]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de sucursales
 *   post:
 *     summary: Crear sucursal
 *     tags: [Branches]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               address:
 *                 type: string
 *               phone:
 *                 type: string
 *     responses:
 *       201:
 *         description: Sucursal creada
 */
router.get('/', checkRole(VIEW_ROLES), branchController.listBranches);

// GET /:id - Detail
router.get('/:id', checkRole(VIEW_ROLES), branchController.getBranchById);

// POST / - Create (Strict RBAC)
router.post('/', checkRole(MANAGE_ROLES), branchController.createBranch);

// PUT /:id - Update (Strict RBAC)
router.put('/:id', checkRole(MANAGE_ROLES), branchController.updateBranch);

module.exports = router;
