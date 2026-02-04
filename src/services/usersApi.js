import api from './api';

const usersApi = {
    getAll: async () => {
        const response = await api.get('/users');
        return response.data;
    },
    create: async (data) => {
        const response = await api.post('/users', data);
        return response.data;
    },
    update: async (id, data) => {
        const response = await api.put(`/users/${id}`, data);
        return response.data;
    },
    delete: async (id) => {
        const response = await api.delete(`/users/${id}`);
        return response.data;
    },
    toggleStatus: async (id, isActive) => {
        const response = await api.put(`/users/${id}`, { isActive });
        return response.data;
    }
};

export default usersApi;
