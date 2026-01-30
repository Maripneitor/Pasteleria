const { AISession } = require('../models');

// Helper: Core Chat Logic (Service Layer)
// En un refactor mayor, esto iría a /services/aiService.js
async function processChatMessage(session, userMessage) {
    const conversation = JSON.parse(session.whatsappConversation || '[]');
    conversation.push({ role: 'user', content: userMessage, timestamp: new Date() });

    // TODO: Aquí iría la llamada real a OpenAI
    const mockResponse = "Respuesta simulada para sesión " + session.id;
    conversation.push({ role: 'assistant', content: mockResponse, timestamp: new Date() });

    session.whatsappConversation = JSON.stringify(conversation);
    await session.save();

    return { responseText: mockResponse, conversation };
}

// Handler Functions

const listInbox = async (req, res) => {
    try {
        const inbox = await AISession.findAll({
            where: { status: 'active' },
            order: [
                ['needsHuman', 'DESC'], // Prioridad a los que piden ayuda
                ['priority', 'DESC'],   // 'urgente' > 'normal'
                ['updatedAt', 'DESC']   // Los más recientes primero
            ]
        });
        res.json(inbox);
    } catch (error) {
        console.error("Inbox Error:", error);
        res.status(500).json({ message: "Error cargando inbox" });
    }
};

const setNeedsHuman = async (req, res) => {
    try {
        const { id } = req.params;
        const session = await AISession.findByPk(id);
        if (!session) return res.status(404).json({ message: 'Sesión no encontrada' });

        session.needsHuman = req.body.needsHuman !== undefined ? req.body.needsHuman : true;

        // Si pide ayuda, subimos prioridad a alta por defecto
        if (session.needsHuman && session.priority === 'normal') {
            session.priority = 'alta';
        }

        await session.save();
        res.json(session);
    } catch (error) {
        res.status(500).json({ message: "Error actualizando estado" });
    }
};

const setPriority = async (req, res) => {
    try {
        const { id } = req.params;
        const { priority } = req.body; // normal, alta, urgente

        const session = await AISession.findByPk(id);
        if (!session) return res.status(404).json({ message: 'Sesión no encontrada' });

        session.priority = priority;
        await session.save();
        res.json(session);
    } catch (error) {
        res.status(500).json({ message: "Error actualizando prioridad" });
    }
};

// PLACEHOLDERS to fix crash
const getActiveSessions = async (req, res) => {
    res.json([]);
};

const getSessionById = async (req, res) => {
    res.status(404).json({ message: "Session not found" });
};

// Manejo de mensajes legacy (Adapter Pattern)
const handleLegacyMessage = async (req, res) => {
    try {
        // 1. Validación de Input
        const { message } = req.body;
        if (!message) {
            return res.status(422).json({ error: { code: 'VALIDATION_ERROR', message: 'Message is required' } });
        }

        const userId = req.user.id; // Resuelto por authMiddleware

        // 2. Resolver Scope (Tenant/User) - En este caso User
        let session = await AISession.findOne({
            where: { userId: userId, status: 'active' },
            order: [['updatedAt', 'DESC']]
        });

        // 3. Auto-creación de sesión si no existe (Comportamiento Legacy)
        if (!session) {
            session = await AISession.create({
                userId,
                status: 'active',
                whatsappConversation: JSON.stringify([])
            });
        }

        // 4. Delegar al Core Logic
        const result = await processChatMessage(session, message);

        // 5. Mapear respuesta al contrato Legacy
        res.json({
            text: result.responseText,
            sessionId: session.id
        });

    } catch (error) {
        console.error("Legacy Message Error:", error);
        res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: "Error procesando mensaje legacy" } });
    }
};

// Manejo de mensajes estándar (Nuevo Contrato)
const postChatMessage = async (req, res) => {
    try {
        const { id } = req.params;
        const { message } = req.body;

        if (!message) {
            return res.status(400).json({ message: 'Message is required' });
        }

        const session = await AISession.findByPk(id);
        if (!session) return res.status(404).json({ message: 'Sesión no encontrada' });

        // Validación de propiedad (Scope Check)
        if (session.userId !== req.user.id) {
            return res.status(403).json({ message: 'No tienes permiso para acceder a esta sesión' });
        }

        const result = await processChatMessage(session, message);

        res.json({
            text: result.responseText,
            conversation: result.conversation
        });
    } catch (error) {
        console.error("Chat Error:", error);
        res.status(500).json({ message: "Error enviando mensaje" });
    }
};

const discardSession = async (req, res) => {
    res.json({ message: "Session discarded" });
};

// EXPLICIT EXPORTS to avoid "undefined" handler crashes
module.exports = {
    listInbox,
    setNeedsHuman,
    setPriority,
    getActiveSessions,
    getSessionById,
    handleLegacyMessage,
    postChatMessage,
    discardSession
};