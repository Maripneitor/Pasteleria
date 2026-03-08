const express = require('express');
const router = express.Router();
const controller = require('./ai-draft.controller');
const authMiddleware = require('../../../middleware/authMiddleware');

// POST /api/v1/ai-draft
router.post('/', authMiddleware, controller.generateDraft);

// POST /api/v1/ai-draft/analyze-image
router.post('/analyze-image', authMiddleware, controller.analyzeImage);

module.exports = router;
