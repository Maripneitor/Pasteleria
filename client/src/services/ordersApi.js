import client from '../config/axios';
import { getToken } from '../utils/auth';

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

    // Calendar Lite (start/end)
    getCalendarEventsLite: async (start, end) => {
        return await client.get(`/folios/calendar?start=${start}&end=${end}`);
    },

    // Calendar Detail (Full info)
    getCalendarDetail: async (id) => {
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
        const toFormData = (data) => {
            const form = new FormData();
            Object.entries(data).forEach(([key, value]) => {
                if (value === undefined || value === null) return;
                if (key === 'referenceImages') return;

                if (typeof value === 'object') form.append(key, JSON.stringify(value));
                else form.append(key, String(value));
            });
            if (data.referenceImages?.length) {
                data.referenceImages.forEach((file) => form.append('referenceImages', file));
            }
            return form;
        };

        const hasFiles = data.referenceImages?.length > 0;
        if (!hasFiles) {
            return await client.put(`/folios/${id}`, data);
        }

        const form = toFormData(data);
        return await client.put(`/folios/${id}`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
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
        const token = getToken();
        return `${apiUrl}/folios/${id}/pdf?token=${encodeURIComponent(token || '')}`;
    },

    getLabelPdfUrl: (id, format = 'a4') => {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
        const token = getToken();
        return `${apiUrl}/folios/${id}/label-pdf?format=${format}&token=${encodeURIComponent(token || '')}`;
    },

    getDaySummaryPdfUrl: (date) => {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
        const token = getToken();
        return `${apiUrl}/folios/day-summary-pdf?date=${date}&token=${encodeURIComponent(token || '')}`;
    },

    // Métodos para descargar PDF via Blob (Headers Auth)
    downloadPdf: async (id) => {
        return await client.get(`/folios/${id}/pdf`, { responseType: 'blob' });
    },

    downloadLabel: async (id, format = 'a4') => {
        return await client.get(`/folios/${id}/label-pdf?format=${format}`, { responseType: 'blob' });
    },

    downloadDaySummary: async (date) => {
        return await client.get(`/folios/day-summary-pdf?date=${date}`, { responseType: 'blob' });
    }
};

// Export individual functions for legacy compatibility if needed
export const createOrder = ordersApi.create;
export const getOrders = ordersApi.list;
export default ordersApi;
