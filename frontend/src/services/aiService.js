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

    /**
     * CREATE: Crear pedido completo usando IA
     * @param {string} userMessage - The user's natural language message to create an order
     * @returns {Promise<object>} - The AI's response with the created order details
     */
    createOrderWithAI: async (userMessage) => {
        try {
            const response = await client.post('/ai/orders/create', { userMessage });
            return response.data;
        } catch (error) {
            console.error('AI Create Order Error:', error);
            throw error;
        }
    },

    /**
     * EDIT: Editar pedido con instrucciones en lenguaje natural
     * @param {string} orderId - The ID of the order to edit
     * @param {string} editInstruction - Natural language instruction for editing the order
     * @returns {Promise<object>} - The AI's response with the updated order details
     */
    editOrderWithAI: async (orderId, editInstruction) => {
        try {
            const response = await client.post('/ai/orders/edit', { orderId, editInstruction });
            return response.data;
        } catch (error) {
            console.error('AI Edit Order Error:', error);
            throw error;
        }
    },

    /**
     * SEARCH: Buscar pedidos con consultas en lenguaje natural
     * @param {string} query - Natural language query to search for orders
     * @returns {Promise<object>} - The AI's response with search results
     */
    searchOrdersWithAI: async (query) => {
        try {
            const response = await client.post('/ai/orders/search', { query });
            return response.data;
        } catch (error) {
            console.error('AI Search Orders Error:', error);
            throw error;
        }
    },

    /**
     * INSIGHTS: Obtener insights del dashboard
     * @param {string} question - Natural language question for dashboard insights
     * @returns {Promise<object>} - The AI's response with dashboard insights
     */
    getDashboardInsights: async (question) => {
        try {
            const response = await client.post('/ai/orders/insights', { question });
            return response.data;
        } catch (error) {
            console.error('AI Get Dashboard Insights Error:', error);
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
