const express = require('express');
const router = express.Router();
const authController = require('./auth.controller');
const authMiddleware = require('../../../middleware/authMiddleware');

/**
 * @swagger
 * /api/v1/auth/register:
 *   post:
 *     summary: Registrar un nuevo usuario (Pendiente de activación)
 *     tags: [Auth]
 */
router.post('/register', authController.register);

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     summary: Iniciar sesión
 *     tags: [Auth]
 */
router.post('/login', authController.login);

/**
 * @swagger
 * /api/v1/auth/me:
 *   get:
 *     summary: Obtener perfil del usuario actual
 *     tags: [Auth]
 *     security:
 *       - BearerAuth: []
 */
router.get('/me', authMiddleware, authController.getMe);

/**
 * @swagger
 * /api/v1/auth/logout:
 *   post:
 *     summary: Cerrar sesión
 *     tags: [Auth]
 *     security:
 *       - BearerAuth: []
 */
router.post('/logout', authMiddleware, authController.logout);

module.exports = router;
