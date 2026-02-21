/**
 * aiService.js
 * Servicio para interactuar con los endpoints de IA del backend.
 * Usado por AiAssistantTray para el chat contextual.
 */
import client from '@/config/axios';

const aiService = {
    /**
     * Envía un mensaje al asistente de IA y devuelve su respuesta.
     * @param {string} message - Texto del usuario
     * @param {object} context - Contexto adicional (ruta actual, etc.)
     * @returns {Promise<{response: string}>}
     */
    sendMessageToAi: async (message, context = {}) => {
        const res = await client.post('/ai/draft', {
            prompt: message,
            context,
        });
        // Normalize: the draft endpoint returns { draft } or { response }
        return {
            response: res.data?.response
                ?? res.data?.message
                ?? JSON.stringify(res.data?.draft ?? res.data)
        };
    },
};

export default aiService;
