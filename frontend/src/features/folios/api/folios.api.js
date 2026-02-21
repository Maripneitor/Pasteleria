import client from '@/config/axios';
import { getToken } from '@/utils/auth';

const foliosApi = {
    // List orders/folios
    listFolios: async (params = {}) => {
        const res = await client.get('/folios', { params });
        return res.data;
    },

    // Listar todos (legacy compatibility name)
    list: async (query = '') => {
        const url = query ? `/folios?q=${query}` : '/folios';
        const res = await client.get(url);
        return res; // Returns full response for some legacy components
    },

    // Get single folio details
    getFolio: async (id) => {
        const res = await client.get(`/folios/${id}`);
        return res.data;
    },

    // Get (legacy compatibility)
    get: async (id) => {
        return await client.get(`/folios/${id}`);
    },

    // Create new folio (FormData for images)
    createFolio: async (data) => {
        const form = new FormData();
        Object.entries(data).forEach(([key, value]) => {
            if (value === undefined || value === null) return;
            if (key === 'referenceImages') return;

            if (typeof value === 'object') {
                form.append(key, JSON.stringify(value));
            } else {
                form.append(key, String(value));
            }
        });

        if (data.referenceImages?.length > 0) {
            data.referenceImages.forEach((file) => {
                form.append('referenceImages', file);
            });
        }

        const res = await client.post('/folios', form, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return res.data;
    },

    // Create (legacy compatibility)
    create: async (data) => {
        return await foliosApi.createFolio(data);
    },

    // Actualizar status (patch)
    status: async (id, statusData) => {
        return await client.patch(`/folios/${id}/status`, statusData);
    },

    // Cancelar
    cancel: async (id, reason = '') => {
        return await client.patch(`/folios/${id}/cancel`, { motivo: reason });
    },

    // PDF Fetchers (Blob strategy)
    getComandaPdfBlob: async (id) => {
        const res = await client.get(`/folios/${id}/pdf/comanda`, {
            responseType: 'blob',
            headers: { 'Accept': 'application/pdf' }
        });
        await checkForBlobError(res.data);
        return res.data;
    },

    getNotaPdfBlob: async (id) => {
        const res = await client.get(`/folios/${id}/pdf/nota`, {
            responseType: 'blob',
            headers: { 'Accept': 'application/pdf' }
        });
        await checkForBlobError(res.data);
        return res.data;
    },

    // Legacy PDF Downloaders
    downloadPdf: async (id) => {
        return await client.get(`/folios/${id}/pdf`, { responseType: 'blob' });
    }
};

export default foliosApi;

// Named export — permite: import { foliosApi } from '...'
// Algunos componentes usan este estilo (OrderCard, CalendarPage, etc.)
export { foliosApi };

// Helper to check if blob is actually a JSON error
const checkForBlobError = async (blob) => {
    if (blob.type === 'application/json') {
        const text = await blob.text();
        try {
            const json = JSON.parse(text);
            throw new Error(json.message || 'Error generando PDF');
        } catch (e) {
            throw e instanceof Error ? e : new Error('Error generando PDF');
        }
    }
};

// Helper to force download of Blob
export const downloadPdfBlob = (blob, filename = 'document.pdf') => {
    const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    }, 100);
};
