const { AISession } = require('../../../models');
const asyncHandler = require('../../core/asyncHandler');

async function processChatMessage(session, userMessage) {
    const conversation = JSON.parse(session.whatsappConversation || '[]');
    conversation.push({ role: 'user', content: userMessage, timestamp: new Date() });

    const lower = userMessage.toLowerCase();
    let responseText = "Entendido.";
    let draftData = null;

    if (lower.includes('hola') || lower.includes('buenos')) {
        responseText = "¡Hola! Soy tu asistente de pastelería virtual. ¿En qué puedo ayudarte hoy?";
    } else if (lower.includes('precio') || lower.includes('cuesta')) {
        responseText = "Los precios dependen del tamaño y diseño. ¿Para cuántas personas lo buscas?";
    } else if (lower.includes('personas') || lower.includes('grande')) {
        responseText = "Perfecto. ¿De qué sabor te gustaría? Tenemos Chocolate, Vainilla y Fresa.";
    } else if (lower.includes('chocolate') || lower.includes('vainilla') || lower.includes('fresa')) {
        responseText = "¡Delicioso! ¿Para cuándo lo necesitas?";
    } else if (lower.includes('nombre') || lower.includes('soy')) {
        responseText = "¡Gracias! He generado un borrador de tu pedido.";
        draftData = { cliente_nombre: "Cliente Mock", sabor: "Chocolate", personas: 20 };
    }

    if (draftData) session.extractedData = draftData;

    conversation.push({ role: 'assistant', content: responseText, timestamp: new Date() });
    session.whatsappConversation = JSON.stringify(conversation);
    await session.save();

    return { responseText, conversation, draft: draftData };
}

exports.listInbox = asyncHandler(async (req, res) => {
    const inbox = await AISession.findAll({
        where: { status: 'active' },
        order: [
            ['needsHuman', 'DESC'],
            ['priority', 'DESC'],
            ['updatedAt', 'DESC']
        ]
    });
    res.json(inbox);
});

exports.setNeedsHuman = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const session = await AISession.findByPk(id);
    if (!session) {
        const err = new Error('Sesión no encontrada');
        err.status = 404;
        throw err;
    }

    session.needsHuman = req.body.needsHuman !== undefined ? req.body.needsHuman : true;
    if (session.needsHuman && session.priority === 'normal') session.priority = 'alta';

    await session.save();
    res.json(session);
});

exports.setPriority = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { priority } = req.body;
    const session = await AISession.findByPk(id);
    if (!session) {
        const err = new Error('Sesión no encontrada');
        err.status = 404;
        throw err;
    }

    session.priority = priority;
    await session.save();
    res.json(session);
});

exports.handleLegacyMessage = asyncHandler(async (req, res) => {
    const { message } = req.body;
    if (!message) {
        const err = new Error('Message is required');
        err.status = 422;
        throw err;
    }

    const userId = req.user.id;
    let session = await AISession.findOne({
        where: { userId, status: 'active' },
        order: [['updatedAt', 'DESC']]
    });

    if (!session) {
        session = await AISession.create({
            userId,
            status: 'active',
            whatsappConversation: JSON.stringify([])
        });
    }

    const result = await processChatMessage(session, message);
    res.json({ text: result.responseText, sessionId: session.id });
});

exports.postChatMessage = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { message } = req.body;

    if (!message) {
        const err = new Error('Message is required');
        err.status = 400;
        throw err;
    }

    const session = await AISession.findByPk(id);
    if (!session) {
        const err = new Error('Sesión no encontrada');
        err.status = 404;
        throw err;
    }

    if (session.userId !== req.user.id) {
        const err = new Error('No tienes permiso');
        err.status = 403;
        throw err;
    }

    const result = await processChatMessage(session, message);
    res.json({
        text: result.responseText,
        conversation: result.conversation,
        draft: result.draft
    });
});

exports.discardSession = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const session = await AISession.findByPk(id);
    if (!session) {
        const err = new Error('Sesión no encontrada');
        err.status = 404;
        throw err;
    }
    session.status = 'cancelled';
    await session.save();
    res.json({ message: "Session discarded" });
});

exports.getActiveSessions = asyncHandler(async (req, res) => {
    res.json([]);
});

exports.getSessionById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const session = await AISession.findByPk(id);
    if (!session) {
        const err = new Error('Session not found');
        err.status = 404;
        throw err;
    }
    res.json(session);
});
