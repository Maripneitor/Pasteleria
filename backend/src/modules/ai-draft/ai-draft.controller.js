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

/**
 * Analiza una imagen de un pastel para extraer detalles.
 * POST /api/v1/ai-draft/analyze-image
 * Body: { imageUrl: "/uploads/reference/xxxxx.jpg" }
 */
const analyzeImage = asyncHandler(async (req, res) => {
    const { imageUrl } = req.body;
    if (!imageUrl) {
        return res.status(400).json({ message: "Se requiere la URL de la imagen." });
    }

    const result = await aiDraftService.analyzeImage(imageUrl);
    res.json(result);
});

module.exports = { generateDraft, analyzeImage };
