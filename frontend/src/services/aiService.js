import client from '../config/axios';

/**
 * Service to handle AI interactions
 */
const aiService = {
    sendMessageToAi: async (message, contextData = {}) => {
        try {
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

    parseOrderIntent: async (text) => {
        try {
            const response = await client.post('/ai/orders/parse', { text });
            return response.data;
        } catch (error) {
            console.error('AI Parse Error:', error);
            throw error;
        }
    },

    createOrderWithAI: async (userMessage) => {
        try {
            const response = await client.post('/ai/orders/create', { userMessage });
            return response.data;
        } catch (error) {
            console.error('AI Create Order Error:', error);
            throw error;
        }
    },

    editOrderWithAI: async (orderId, editInstruction) => {
        try {
            const response = await client.post('/ai/orders/edit', { orderId, editInstruction });
            return response.data;
        } catch (error) {
            console.error('AI Edit Order Error:', error);
            throw error;
        }
    },

    searchOrdersWithAI: async (query) => {
        try {
            const response = await client.post('/ai/orders/search', { query });
            return response.data;
        } catch (error) {
            console.error('AI Search Orders Error:', error);
            throw error;
        }
    },

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