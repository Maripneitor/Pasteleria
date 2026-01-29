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
    }
};

export default aiService;
