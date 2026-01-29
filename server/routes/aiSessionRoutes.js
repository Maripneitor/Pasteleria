const express = require('express');
const router = express.Router();
const aiSessionController = require('../controllers/aiSessionController');
const authMiddleware = require('../middleware/authMiddleware');

// Protegemos todas las rutas de sesiones con autenticación
router.use(authMiddleware);

router.route('/')
    .get(aiSessionController.getActiveSessions);

router.route('/:id')
    .get(aiSessionController.getSessionById);

router.route('/:id/chat')
    .post(aiSessionController.postChatMessage);

// ===== INICIO DE LA MODIFICACIÓN =====
// Ruta para descartar (marcar como 'cancelled') una sesión de IA
router.delete('/:id', aiSessionController.discardSession);

// ===== Nuevas Rutas Inbox =====
router.get('/inbox/list', aiSessionController.listInbox);
router.patch('/:id/needs-human', aiSessionController.setNeedsHuman);
router.patch('/:id/priority', aiSessionController.setPriority);

module.exports = router;