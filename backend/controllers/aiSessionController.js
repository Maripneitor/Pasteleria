const { AISession } = require('../models');

const openaiClient = require('../services/openaiResponsesClient');

// Helper: Core Chat Logic (Service Layer)
// En un refactor mayor, esto iría a /services/aiService.js
// Helper: Core Chat Logic (Smart Mock)
async function processChatMessage(session, userMessage) {
    const conversation = JSON.parse(session.whatsappConversation || '[]');
    conversation.push({ role: 'user', content: userMessage, timestamp: new Date() });

    // --- SMART MOCK LOGIC (No OpenAI Key) ---
    // 1. Detección simple de intenciones
    const lower = userMessage.toLowerCase();

    let responseText = "Entendido.";
    let draftData = null;

    if (lower.includes('hola') || lower.includes('buenos')) {
        responseText = "¡Hola! Soy tu asistente de pastelería virtual. ¿En qué puedo ayudarte hoy? ¿Quieres levantar un pedido?";
    } else if (lower.includes('precio') || lower.includes('cuesta')) {
        responseText = "Los precios dependen del tamaño y diseño. Un pastel básico empieza en $250. ¿Para cuántas personas lo buscas?";
    } else if (lower.includes('personas') || lower.includes('grande')) {
        responseText = "Perfecto. ¿De qué sabor te gustaría? Tenemos Chocolate, Vainilla y Fresa.";
    } else if (lower.includes('chocolate') || lower.includes('vainilla') || lower.includes('fresa')) {
        responseText = "¡Delicioso! ¿Para cuándo lo necesitas? (Fecha y Hora)";
    } else if (lower.includes('mañana') || lower.includes('hoy') || /\d/.test(lower)) {
        responseText = "Anotado. ¿Cuál es el nombre del cliente y algún teléfono de contacto?";
    } else if (lower.includes('nombre') || lower.includes('soy')) {
        responseText = "¡Gracias! He generado un borrador de tu pedido. Puedes revisarlo en la sección de 'Nuevo Pedido'.";

        // Generar Draft Mock
        draftData = {
            cliente_nombre: "Cliente Mock",
            sabor: "Chocolate",
            personas: 20
        };
    } else {
        responseText = "Entiendo. ¿Me podrías dar más detalles sobre el pedido?";
    }

    // Update Session with extracted data if found
    if (draftData) {
        session.extractedData = draftData;
    }

    // Save Assistant Response
    conversation.push({ role: 'assistant', content: responseText, timestamp: new Date() });

    session.whatsappConversation = JSON.stringify(conversation);
    await session.save();

    return { responseText, conversation, draft: draftData };
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

// --- New Session Management Functions ---

const getActiveSessions = async (req, res) => {
    try {
        // Fetch sessions for the current user
        // If tenant-scoped, filter by tenantId (req.user.tenantId)
        const sessions = await AISession.findAll({
            where: {
                tenantId: req.user.tenantId,
                // optionally filter by userId if we want private sessions
                // responsibleUserId: req.user.id 
            },
            order: [['updatedAt', 'DESC']],
            limit: 20
        });
        res.json(sessions);
    } catch (error) {
        console.error("GetSessions Error:", error);
        res.status(500).json({ message: "Error cargando sesiones" });
    }
};

const getSessionById = async (req, res) => {
    try {
        const { id } = req.params;
        const session = await AISession.findOne({
            where: { id, tenantId: req.user.tenantId }
        });
        if (!session) return res.status(404).json({ message: 'Sesión no encontrada' });
        res.json(session);
    } catch (error) {
        res.status(500).json({ message: "Error cargando sesión" });
    }
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
            conversation: result.conversation,
            draft: result.draft
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