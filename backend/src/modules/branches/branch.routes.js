const express = require('express');
const router = express.Router();
const branchController = require('./branch.controller');
const authMiddleware = require('../../../middleware/authMiddleware');
const tenantScope = require('../../../middleware/tenantScope');
const checkRole = require('../../../middleware/checkRole');

// All routes require Auth + Tenant
router.use(authMiddleware);
router.use(tenantScope);

// Roles allowed to Manage (Create/Update)
const MANAGE_ROLES = ['OWNER', 'ADMIN', 'SUPER_ADMIN'];
// Roles allowed to View (List)
const VIEW_ROLES = ['OWNER', 'ADMIN', 'SUPER_ADMIN', 'EMPLOYEE'];

router.get('/', checkRole(VIEW_ROLES), branchController.listBranches);
router.get('/:id', checkRole(VIEW_ROLES), branchController.getBranchById);
router.post('/', checkRole(MANAGE_ROLES), branchController.createBranch);
router.put('/:id', checkRole(MANAGE_ROLES), branchController.updateBranch);

module.exports = router;
