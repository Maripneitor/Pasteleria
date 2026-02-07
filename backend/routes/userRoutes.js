const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');
const checkRole = require('../middleware/checkRole');

// Rutas protegidas: Solo ADMIN
// Rutas protegidas: Solo ADMIN/OWNER
const ALLOWED = ['ADMIN', 'SUPER_ADMIN', 'OWNER'];

router.get('/', authMiddleware, checkRole(ALLOWED), userController.getAllUsers);
router.post('/', authMiddleware, checkRole(ALLOWED), userController.createUser);
router.put('/:id', authMiddleware, checkRole(ALLOWED), userController.updateUser);
router.delete('/:id', authMiddleware, checkRole(ALLOWED), userController.deleteUser);

module.exports = router;