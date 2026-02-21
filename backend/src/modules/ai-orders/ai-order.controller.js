const aiOrderParsingService = require('../../../services/aiOrderParsingService');
const orderFlowService = require('../../../services/orderFlowService');
const asyncHandler = require('../../core/asyncHandler');

exports.parseOrder = asyncHandler(async (req, res) => {
    const { text } = req.body;
    if (!text) return res.status(400).json({ message: 'Text is required' });

    const result = await aiOrderParsingService.parseOrder(text, req.user.tenantId);

    if (!result.valid) {
        return res.status(400).json({
            message: 'Validation Failed',
            errors: result.errors,
            raw: result.data // Optional: return raw for debugging
        });
    }

    const payload = {
        cliente_nombre: result.data.customerName || 'Cliente',
        cliente_telefono: result.data.phone || '000',
        fecha_entrega: result.data.deliveryDate,
        sabores_pan: result.data.flavorId ? [result.data.flavorId] : [],
        descripcion_diseno: result.data.specs
    };

    const draft = await orderFlowService.createDraft(payload, req.user);

    res.json({
        valid: true,
        draft,
        aiAnalysis: result.data
    });
});
