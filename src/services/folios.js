import client from '../config/axios';

const foliosApi = {
    // List orders/folios
    listFolios: async (params = {}) => {
        const res = await client.get('/folios', { params });
        return res.data;
    },

    // Get single folio details
    getFolio: async (id) => {
        const res = await client.get(`/folios/${id}`);
        return res.data; // Usually returns { folio: ... } or just ...
    },

    // Create new folio (Order)
    createFolio: async (payload) => {
        const res = await client.post('/folios', payload);
        return res.data;
    },

    // PDF Fetchers (Blob strategy for Auth headers)
    getComandaPdfBlob: async (id) => {
        const res = await client.get(`/folios/${id}/pdf/comanda`, {
            responseType: 'blob',
            headers: { 'Accept': 'application/pdf' }
        });
        return res.data;
    },

    getNotaPdfBlob: async (id) => {
        const res = await client.get(`/folios/${id}/pdf/nota`, {
            responseType: 'blob',
            headers: { 'Accept': 'application/pdf' }
        });
        return res.data;
    }
};

export default foliosApi;

// Helper to open Blob in new tab
export const openPdfInNewTab = (blob, filename = 'document.pdf') => {
    const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    // If we wanted to force download:
    // link.setAttribute('download', filename);
    // document.body.appendChild(link);
    // link.click();

    // Open in new tab:
    window.open(url, '_blank');

    // Cleanup after a delay to allow load
    setTimeout(() => window.URL.revokeObjectURL(url), 60000);
};
