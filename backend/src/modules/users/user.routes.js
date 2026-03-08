const express = require('express');
const router = express.Router();
const userController = require('./user.controller');
const authMiddleware = require('../../../middleware/authMiddleware');
const checkRole = require('../../../middleware/checkRole');

// Configuration
const ADMIN_ROLES = ['ADMIN', 'SUPER_ADMIN', 'OWNER'];

// Routes
router.use(authMiddleware);

router.get('/', checkRole(ADMIN_ROLES), userController.getAllUsers);
router.get('/pending', checkRole(ADMIN_ROLES), userController.getPendingUsers);
router.post('/', checkRole(ADMIN_ROLES), userController.createUser);
router.put('/:id', checkRole(ADMIN_ROLES), userController.updateUser);
router.delete('/:id', checkRole(ADMIN_ROLES), userController.deleteUser);

module.exports = router;