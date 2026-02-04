import api from './api';

const reportsApi = {
    /**
     * Triggers the backend email sending process
     * @param {string} date - YYYY-MM-DD
     * @returns {Promise<Object>}
     */
    sendDailyCut: async (date, force = false) => {
        const response = await api.post('/reports/daily-cut', { date, force });
        return response.data;
    },

    /**
     * Downloads/Opens the PDF of the daily cut
     * @param {string} date - YYYY-MM-DD
     * @returns {Promise<Blob>}
     */
    getDailyCutPdf: async (date) => {
        const response = await api.get('/reports/daily-cut/preview', {
            params: { date },
            responseType: 'blob'
        });
        return response; // Return full response key for pdfHelper to check headers
    }
};

export default reportsApi;
