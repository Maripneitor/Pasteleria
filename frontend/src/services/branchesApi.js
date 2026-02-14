import api from './api';

const branchesApi = {
    getAll: async () => {
        const response = await api.get('/branches');
        // Adapt response: sometimes it's res.data.data or just res.data
        return response.data?.data || response.data || [];
    },
    getById: async (id) => {
        const response = await api.get(`/branches/${id}`);
        return response.data?.data || response.data;
    },
    create: async (data) => {
        const response = await api.post('/branches', data);
        return response.data?.data || response.data;
    },
    update: async (id, data) => {
        const response = await api.put(`/branches/${id}`, data);
        return response.data?.data || response.data;
    },
    delete: async (id) => {
        const response = await api.delete(`/branches/${id}`);
        return response.data;
    }
};

export default branchesApi;
