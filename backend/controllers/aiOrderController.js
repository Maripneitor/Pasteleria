const aiOrderParsingService = require('../services/aiOrderParsingService');
const orderFlowService = require('../services/orderFlowService');
const { AISession } = require('../models');

exports.parseOrder = async (req, res) => {
    try {
        const { text, sessionId } = req.body;
        if (!text) return res.status(400).json({ message: 'Text is required' });

        // 1. Parse with AI
        const result = await aiOrderParsingService.parseOrder(text, req.user.tenantId);
        const aiData = result.data;

        // 2. Find or Create Session (Persistence)
        let session = null;
        if (sessionId) {
            session = await AISession.findByPk(sessionId);
        }

        if (!session) {
            // Create new session if none exists
            session = await AISession.create({
                userId: req.user.id,
                tenantId: req.user.tenantId,
                status: 'active',
                whatsappConversation: JSON.stringify([{ role: 'user', content: text }])
            });
        } else {
            // Append to existing conversation
            const hist = JSON.parse(session.whatsappConversation || '[]');
            hist.push({ role: 'user', content: text });
            session.whatsappConversation = JSON.stringify(hist);
        }

        // 3. Update Session Data
        const currentData = session.extractedData || {};
        const newData = {
            cliente_nombre: aiData.customerName || currentData.cliente_nombre,
            cliente_telefono: aiData.phone || currentData.cliente_telefono,
            fecha_entrega: aiData.deliveryDate || currentData.fecha_entrega,
            sabores_pan: aiData.flavorId ? [aiData.flavorId] : (currentData.sabores_pan || []),
            rellenos: aiData.fillingId ? [aiData.fillingId] : (currentData.rellenos || []),
            descripcion_diseno: aiData.specs || currentData.descripcion_diseno
        };

        session.extractedData = newData;

        // Save assistant response
        if (aiData.assistant_response) {
            const hist = JSON.parse(session.whatsappConversation || '[]');
            hist.push({ role: 'assistant', content: aiData.assistant_response });
            session.whatsappConversation = JSON.stringify(hist);
        }

        await session.save();

        // 4. Return response (Success even if incomplete)
        res.json({
            valid: result.valid,
            assistant_response: aiData.assistant_response,
            draft: newData,
            sessionId: session.id,
            missing: aiData.missing_fields || []
        });

    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'AI Parsing Failed', error: e.message });
    }
};
