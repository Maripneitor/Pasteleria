import client from '../config/axios';

/**
 * Service to handle AI interactions
 */
const aiService = {
    /**
     * Sends a message to the AI backend
     * @param {string} message - The user's message
     * @param {object} contextData - Information about the current user context (e.g. current page)
     * @returns {Promise<object>} - The AI's response { text, ... }
     */
    sendMessageToAi: async (message, contextData = {}) => {
        try {
            // Note: Adjust the endpoint if necessary based on your server routes
            const response = await client.post('/ai/session/message', {
                message,
                context: contextData
            });
            return response.data;
        } catch (error) {
            console.error('AI Service Error:', error);
            throw error;
        }
    },

    /**
     * Parses a natural language order intent
     * @param {string} text - The order description
     * @returns {Promise<object>} - { valid, draft, aiAnalysis }
     */
    parseOrderIntent: async (text) => {
        try {
            const response = await client.post('/ai/orders/parse', { text });
            return response.data;
        } catch (error) {
            console.error('AI Parse Error:', error);
            throw error;
        }
    },

    getSessions: async () => {
        try {
            const response = await client.get('/ai-sessions');
            return response.data;
        } catch (error) {
            console.error('Get Sessions Error:', error);
            return [];
        }
    },

    deleteSession: async (id) => {
        try {
            await client.delete(`/ai-sessions/${id}`);
            return true;
        } catch (error) {
            console.error('Delete Session Error:', error);
            return false;
        }
    }
};

export default aiService;
