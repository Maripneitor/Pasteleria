const express = require('express');
const router = express.Router();
const aiSessionController = require('../controllers/aiSessionController');
const authMiddleware = require('../middleware/authMiddleware');

// Guard: Validate Controller Exports
const requiredHandlers = [
    'getActiveSessions',
    'getSessionById',
    'handleLegacyMessage',
    'postChatMessage',
    'discardSession',
    'listInbox',
    'setNeedsHuman',
    'setPriority'
];

requiredHandlers.forEach(handler => {
    if (typeof aiSessionController[handler] !== 'function') {
        throw new Error(`CRITICAL: aiSessionController.${handler} is undefined in routes/aiSessionRoutes.js`);
    }
});

// Protegemos todas las rutas de sesiones con autenticación
router.use(authMiddleware);

router.route('/')
    .get(aiSessionController.getActiveSessions);

router.route('/:id')
    .get(aiSessionController.getSessionById);

// Ruta Legacy (compatible con frontend actual)
router.post('/message', aiSessionController.handleLegacyMessage);

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