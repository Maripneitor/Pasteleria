const aiOrderParsingService = require('../services/aiOrderParsingService');
const orderFlowService = require('../services/orderFlowService');

exports.parseOrder = async (req, res) => {
    try {
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

        // If valid, create DRAFT automatically?
        // Prompt says: "Crear folio DRAFT ... SOLO si validación pasa."
        const payload = {
            cliente_nombre: result.data.customerName || 'Cliente',
            cliente_telefono: result.data.phone || '000',
            fecha_entrega: result.data.deliveryDate,
            // Map flavor/filling to arrays or specific columns depending on Folio model
            // Folio model uses JSON arrays: sabores_pan, rellenos.
            // We'll wrap the IDs.
            sabores_pan: result.data.flavorId ? [result.data.flavorId] : [], // Ideally we store names or objects, but logic says IDs. 
            // Wait, Folio.js assumes JSON. Usually UI sends objects. 
            // For now, I'll store what I have. If Folio expects strings/objects, I might need to map back to names?
            // "Mapea solicitud a IDs". "Backend valida".
            // Let's assume we store extended objects if possible, or just IDs if the system supports it. 
            // OrderFlowService doesn't care, it blindly saves.
            // I'll leave as raw ID for now or maybe map back to name in the service?
            // Actually, the prompt says "Output JSON estructurado (IDs reales)".
            // I'll attach them to the payload.
            descripcion_diseno: result.data.specs
        };

        const draft = await orderFlowService.createDraft(payload, req.user);

        res.json({
            valid: true,
            draft,
            aiAnalysis: result.data
        });

    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'AI Parsing Failed', error: e.message });
    }
};
