const aiDraftService = require('../../../services/aiDraftService');
const asyncHandler = require('../../core/asyncHandler');

/**
 * Genera un borrador de pedido basado en texto libre.
 * POST /api/v1/ai-draft
 * Body: { prompt: "..." }
 */
const generateDraft = asyncHandler(async (req, res) => {
    const { prompt } = req.body;

    if (!prompt) {
        return res.status(400).json({ message: "Se requiere un prompt" });
    }

    // Delegate to Service (OpenAI or Fallback)
    const result = await aiDraftService.processDraft(prompt);
    res.json(result);
});

module.exports = { generateDraft };
