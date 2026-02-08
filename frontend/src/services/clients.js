import client from '../config/axios';

const clientsApi = {
    // Listar clientes (con búsqueda opcional)
    listClients: async ({ q = '' } = {}) => {
        const params = {};
        if (q) params.q = q;
        const response = await client.get('/clients', { params });
        return response.data;
    },

    // Crear cliente
    createClient: async (payload) => {
        const response = await client.post('/clients', payload);
        return response.data;
    },

    // Buscar cliente (para Autocomplete)
    searchClients: async (query) => {
        // Reutlizers search logic if backend supports it via 'q' param
        if (!query) return [];
        const data = await clientsApi.listClients({ q: query });
        // Backend might return all if q is ignored, so we filter in frontend just in case
        // But ideally backend handles it. For now assuming backend returns all or filtered
        return data.filter(c => c.name.toLowerCase().includes(query.toLowerCase()));
    }
};

export default clientsApi;
