const express = require('express');
const router = express.Router();
const aiSessionController = require('./ai-session.controller');
const authMiddleware = require('../../../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/', aiSessionController.getActiveSessions);
router.get('/inbox/list', aiSessionController.listInbox);
router.get('/:id', aiSessionController.getSessionById);
router.post('/message', aiSessionController.handleLegacyMessage);
router.post('/:id/chat', aiSessionController.postChatMessage);
router.delete('/:id', aiSessionController.discardSession);
router.patch('/:id/needs-human', aiSessionController.setNeedsHuman);
router.patch('/:id/priority', aiSessionController.setPriority);

module.exports = router;
