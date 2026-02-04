import client from '../config/axios';

const catalogApi = {
    // FLAVORS
    getFlavors: async (includeInactive = false) => {
        const res = await client.get(`/catalog/flavors?includeInactive=${includeInactive}`);
        return res.data;
    },
    createFlavor: async (data) => {
        const res = await client.post('/catalog/flavors', data);
        return res.data;
    },
    updateFlavor: async (id, data) => {
        const res = await client.put(`/catalog/flavors/${id}`, data);
        return res.data;
    },
    toggleFlavor: async (id, isActive) => {
        const res = await client.patch(`/catalog/flavors/${id}/active`, { isActive });
        return res.data;
    },

    // FILLINGS
    getFillings: async (includeInactive = false) => {
        const res = await client.get(`/catalog/fillings?includeInactive=${includeInactive}`);
        return res.data;
    },
    createFilling: async (data) => {
        const res = await client.post('/catalog/fillings', data);
        return res.data;
    },
    updateFilling: async (id, data) => {
        const res = await client.put(`/catalog/fillings/${id}`, data);
        return res.data;
    },
    toggleFilling: async (id, isActive) => {
        const res = await client.patch(`/catalog/fillings/${id}/active`, { isActive });
        return res.data;
    }
};

export default catalogApi;
