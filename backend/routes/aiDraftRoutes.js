const express = require('express');
const router = express.Router();
const controller = require('../controllers/aiDraftController');
const authMiddleware = require('../middleware/authMiddleware');

// POST /api/ai/draft
router.post('/', authMiddleware, controller.generateDraft);

module.exports = router;
