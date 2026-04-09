import client from '@/config/axios';
import { getToken } from '@/utils/auth';

const foliosApi = {
    listFolios: async (params = {}) => {
        const res = await client.get('/folios', { params });
        return res.data;
    },
    getCalendarEventsLite: async (start, end) => {
        const res = await client.get('/folios/calendar', { params: { start, end } });
        return res; 
    },
    getCalendarDetail: async (id) => {
        return await client.get(`/folios/${id}`);
    },
    downloadDaySummary: async (date) => {
        return await client.get(`/folios/pdf/comandas/${date}`, { responseType: 'blob' });
    },
    downloadLabel: async (id, type = 'thermal') => {
        return await client.get(`/folios/${id}/label-pdf`, {
            params: { type },
            responseType: 'blob'
        });
    },
    list: async (query = '') => {
        const url = query ? `/folios?q=${query}` : '/folios';
        const res = await client.get(url);
        return res; 
    },
    getFolio: async (id) => {
        const res = await client.get(`/folios/${id}`);
        return res.data;
    },
    getAudits: async (id) => {
        const res = await client.get(`/folios/${id}/audits`);
        return res.data;
    },
    get: async (id) => {
        return await client.get(`/folios/${id}`);
    },

    createFolio: async (data) => {
        const form = new FormData();
        Object.entries(data).forEach(([key, value]) => {
            if (value === undefined || value === null) return;
            // 🚀 FIX: Evitar duplicados. Saltamos las keys que manejaremos manualmente o son archivos.
            if (['referenceImages', 'existingImages', 'extraHeight', 'altura_extra'].includes(key)) return;

            if (typeof value === 'object') {
                form.append(key, JSON.stringify(value));
            } else {
                form.append(key, String(value));
            }
        });

        // 🔥 FIX: Única inyección de verdad. Forzamos a String explícito.
        const isExtra = data.extraHeight === true || data.extraHeight === 'true';
        form.append('extraHeight', isExtra ? 'true' : 'false');
        form.append('altura_extra', isExtra ? 'Sí' : 'No');

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

    updateFolio: async (id, data) => {
        const form = new FormData();
        Object.entries(data).forEach(([key, value]) => {
            if (value === undefined || value === null) return;
            // 🚀 FIX: Evitar duplicados. Saltamos las keys que manejaremos manualmente.
            if (['referenceImages', 'existingImages', 'extraHeight', 'altura_extra'].includes(key)) return;

            if (typeof value === 'object') {
                form.append(key, JSON.stringify(value));
            } else {
                form.append(key, String(value));
            }
        });

        // 🔥 FIX: Única inyección de verdad al actualizar.
        const isExtra = data.extraHeight === true || data.extraHeight === 'true';
        form.append('extraHeight', isExtra ? 'true' : 'false');
        form.append('altura_extra', isExtra ? 'Sí' : 'No');

        if (data.referenceImages?.length > 0) {
            data.referenceImages.forEach((file) => {
                if (file instanceof File) {
                    form.append('referenceImages', file);
                } else {
                    form.append('existingImages', file);
                }
            });
        }

        const res = await client.put(`/folios/${id}`, form, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return res.data;
    },

    create: async (data) => {
        return await foliosApi.createFolio(data);
    },
    status: async (id, statusData) => {
        return await client.patch(`/folios/${id}/status`, statusData);
    },
    cancel: async (id, reason = '') => {
        return await client.patch(`/folios/${id}/cancel`, { motivo: reason });
    },
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
    downloadPdf: async (id) => {
        return await client.get(`/folios/${id}/pdf`, { responseType: 'blob' });
    }
};

export default foliosApi;
export { foliosApi };

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