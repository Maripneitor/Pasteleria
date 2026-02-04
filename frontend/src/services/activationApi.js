import axios from '../config/axios';

export const activationApi = {
    // Owner generates code
    generateCode: async () => {
        const response = await axios.post('/activation/generate');
        return response.data;
    },

    // User verifies code to active account
    verifyCode: async (code, tempToken) => {
        // If we have a tempToken, we must use it in headers specifically for this request
        // OR rely on axios interceptor if we saved it?
        // Better to pass explicit header override if we haven't saved it as main token yet.
        const config = tempToken ? { headers: { Authorization: `Bearer ${tempToken}` } } : {};

        const response = await axios.post('/activation/verify', { code }, config);
        return response.data;
    }
};
