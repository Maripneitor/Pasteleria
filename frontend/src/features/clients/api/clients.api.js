import client from '@/config/axios';

const clientsApi = {
    // Listar todos
    listClients: async (params = {}) => {
        const res = await client.get('/clients', { params });
        return res.data;
    },

    // Búsqueda por nombre o teléfono (para Autocomplete)
    searchClients: async (q = '') => {
        const res = await client.get('/clients', { params: { q } });
        // Backend returns array directly or { data: [] }
        return Array.isArray(res.data) ? res.data : (res.data?.data ?? []);
    },

    // Crear uno
    createClient: async (data) => {
        const res = await client.post('/clients', data);
        return res.data;
    }
};

export default clientsApi;
