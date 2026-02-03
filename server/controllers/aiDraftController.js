const aiDraftService = require('../services/aiDraftService');

/**
 * Genera un borrador de pedido basado en texto libre.
 * POST /api/ai/draft
 * Body: { prompt: "..." }
 */
const generateDraft = async (req, res) => {
    try {
        const { prompt } = req.body;

        if (!prompt) {
            return res.status(400).json({ message: "Se requiere un prompt" });
        }

        // Delegate to Service (OpenAI or Fallback)
        const result = await aiDraftService.processDraft(prompt);
        res.json(result);

    } catch (error) {
        console.error("Critical Draft Error:", error);
        res.status(500).json({ message: "Error generando borrador" });
    }
};

module.exports = { generateDraft };
