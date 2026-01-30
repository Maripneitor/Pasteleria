import client from '../config/axios';

export const ordersApi = {
    // Listar todos (con soporte de búsqueda ?q=...)
    list: async (query = '') => {
        const url = query ? `/folios?q=${query}` : '/folios';
        return await client.get(url);
    },

    // Obtener uno por ID
    get: async (id) => {
        return await client.get(`/folios/${id}`);
    },

    // Crear nuevo
    create: async (data) => {
        const form = new FormData();

        Object.entries(data).forEach(([key, value]) => {
            if (value === undefined || value === null) return;
            if (key === 'referenceImages') return; // Se maneja aparte

            // Si es objeto/array, lo mandamos como JSON string
            if (typeof value === 'object') {
                form.append(key, JSON.stringify(value));
            } else {
                form.append(key, String(value));
            }
        });

        // Manejo de imágenes (File objects)
        if (data.referenceImages && data.referenceImages.length > 0) {
            data.referenceImages.forEach((file) => {
                form.append('referenceImages', file);
            });
        }

        return await client.post('/folios', form, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    },

    // Actualizar (put completo)
    update: async (id, data) => {
        return await client.put(`/folios/${id}`, data);
    },

    // Actualizar status (patch)
    status: async (id, statusData) => {
        // statusData puede ser { estatus_produccion: '...' } o { estatus_pago: '...' }
        // El backend tiene PATCH /:id/cancel y PUT /:id, pero para status KDS usamos updateFolioStatus en PATCH /:id/status (si existe)
        // Revisando folioRoutes... existe PATCH /:id/status que llama updateFolioStatus
        return await client.patch(`/folios/${id}/status`, statusData);
    },

    // Cancelar
    cancel: async (id, reason = '') => {
        return await client.patch(`/folios/${id}/cancel`, { motivo: reason });
    },

    // Eliminar
    delete: async (id) => {
        return await client.delete(`/folios/${id}`);
    },

    // PDF URL helper (no es llamada axios directa, regresa string)
    getPdfUrl: (id) => {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
        return `${apiUrl}/folios/${id}/pdf`;
    }
};

// Export individual functions for legacy compatibility if needed
export const createOrder = ordersApi.create;
export const getOrders = ordersApi.list;
export default ordersApi;
