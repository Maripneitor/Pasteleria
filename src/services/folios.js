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

    // PDF Fetchers (Blob strategy with Error Handling)
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
    }
};

export default foliosApi;

// Helper to check if blob is actually a JSON error
const checkForBlobError = async (blob) => {
    if (blob.type === 'application/json') {
        const text = await blob.text();
        try {
            const json = JSON.parse(text);
            throw new Error(json.message || 'Error generando PDF');
        } catch (e) {
            // Rethrow the parsed error, or the original if parsing failed
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

    // Cleanup
    setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    }, 100);
};
