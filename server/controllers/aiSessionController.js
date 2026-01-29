const { AISession } = require('../models');

// Lista para la bandeja de entrada
exports.listInbox = async (req, res) => {
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

// Marcar necesidad humana
exports.setNeedsHuman = async (req, res) => {
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

// Cambiar prioridad
exports.setPriority = async (req, res) => {
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

// ... Resto de métodos de AI (createSession, update, etc) si ya existían o los creas aquí
// Si ya tenías un controller, mézclalo. Asumo nuevo o extensión. 
// Para no romper, exportare solo lo nuevo y el usuario debe integrarlo en el existente o reemplazarlo.
// Revisando imports en server.js: aiSessionRoutes. Probablemente llamaba a algo ya.
// Debería ver el controller actual.