const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// Rutas protegidas: Solo ADMIN
router.get('/', authMiddleware, roleMiddleware(['ADMIN', 'Administrador']), userController.getAllUsers);
router.post('/', authMiddleware, roleMiddleware(['ADMIN', 'Administrador']), userController.createUser);
router.put('/:id', authMiddleware, roleMiddleware(['ADMIN', 'Administrador']), userController.updateUser);
router.delete('/:id', authMiddleware, roleMiddleware(['ADMIN', 'Administrador']), userController.deleteUser);

module.exports = router;