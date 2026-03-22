import client from '@/config/axios';

const catalogApi = {
    // FLAVORS
    getFlavors: async (includeInactive = false) => {
        const res = await client.get(`/catalogs/flavors?includeInactive=${includeInactive}`);
        return res.data;
    },
    createFlavor: async (data) => {
        const res = await client.post('/catalogs/flavors', data);
        return res.data;
    },
    updateFlavor: async (id, data) => {
        const res = await client.put(`/catalogs/flavors/${id}`, data);
        return res.data;
    },
    toggleFlavor: async (id, isActive) => {
        const res = await client.patch(`/catalogs/flavors/${id}/active`, { isActive });
        return res.data;
    },
    deleteFlavor: async (id) => {
        const res = await client.delete(`/catalogs/flavors/${id}`);
        return res.data;
    },

    // FILLINGS
    getFillings: async (includeInactive = false) => {
        const res = await client.get(`/catalogs/fillings?includeInactive=${includeInactive}`);
        return res.data;
    },
    createFilling: async (data) => {
        const res = await client.post('/catalogs/fillings', data);
        return res.data;
    },
    updateFilling: async (id, data) => {
        const res = await client.put(`/catalogs/fillings/${id}`, data);
        return res.data;
    },
    toggleFilling: async (id, isActive) => {
        const res = await client.patch(`/catalogs/fillings/${id}/active`, { isActive });
        return res.data;
    },
    deleteFilling: async (id) => {
        const res = await client.delete(`/catalogs/fillings/${id}`);
        return res.data;
    },

    // PRODUCTS
    getProducts: async (includeInactive = false) => {
        const res = await client.get(`/catalogs/products?includeInactive=${includeInactive}`);
        return res.data;
    },
    createProduct: async (data) => {
        const res = await client.post('/catalogs/products', data);
        return res.data;
    },
    toggleProduct: async (id, isActive) => {
        const res = await client.patch(`/catalogs/products/${id}/active`, { isActive });
        return res.data;
    },

    // DECORATIONS
    getDecorations: async (includeInactive = false) => {
        const res = await client.get(`/catalogs/decorations?includeInactive=${includeInactive}`);
        return res.data;
    },
    createDecoration: async (data) => {
        const res = await client.post('/catalogs/decorations', data);
        return res.data;
    },
    toggleDecoration: async (id, isActive) => {
        const res = await client.patch(`/catalogs/decorations/${id}/active`, { isActive });
        return res.data;
    },

    // SHAPES
    getShapes: async (type, includeInactive = false) => {
        const res = await client.get(`/catalogs/shapes?type=${type}&includeInactive=${includeInactive}`);
        return res.data;
    },
    createShape: async (data) => {
        const res = await client.post('/catalogs/shapes', data);
        return res.data;
    },
    updateShape: async (id, data) => {
        const res = await client.put(`/catalogs/shapes/${id}`, data);
        return res.data;
    },
    toggleShape: async (id, isActive) => {
        const res = await client.patch(`/catalogs/shapes/${id}/active`, { isActive });
        return res.data;
    },
    deleteShape: async (id) => {
        const res = await client.delete(`/catalogs/shapes/${id}`);
        return res.data;
    },

    // SIZES
    getSizes: async (type, includeInactive = false) => {
        const res = await client.get(`/catalogs/sizes?type=${type}&includeInactive=${includeInactive}`);
        return res.data;
    },
    createSize: async (data) => {
        const res = await client.post('/catalogs/sizes', data);
        return res.data;
    },
    updateSize: async (id, data) => {
        const res = await client.put(`/catalogs/sizes/${id}`, data);
        return res.data;
    },
    toggleSize: async (id, isActive) => {
        const res = await client.patch(`/catalogs/sizes/${id}/active`, { isActive });
        return res.data;
    },
    deleteSize: async (id) => {
        const res = await client.delete(`/catalogs/sizes/${id}`);
        return res.data;
    }
};

export default catalogApi;
