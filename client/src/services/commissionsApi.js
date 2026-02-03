import api from './api';

const commissionsApi = {
    /**
     * Get commissions report for a date range
     * @param {string} from - YYYY-MM-DD
     * @param {string} to - YYYY-MM-DD
     * @returns {Promise<Object>} Report data
     */
    getReport: async (from, to) => {
        const response = await api.get(`/commissions/report`, {
            params: { from, to }
        });
        return response.data;
    },

    /**
     * Get commissions report PDF
     * @param {string} from - YYYY-MM-DD
     * @param {string} to - YYYY-MM-DD
     * @returns {Promise<Blob>}
     */
    getReportPdf: async (from, to) => {
        const response = await api.get(`/commissions/report/pdf`, {
            params: { from, to },
            responseType: 'blob'
        });
        return response; // Return full response for pdfHelper
    },

    /**
     * Manually trigger a commission calculation/check if needed
     * @returns {Promise<Object>}
     */
    triggerCheck: async () => {
        // Optional endpoint if implemented
        const response = await api.post(`/commissions/trigger-report`);
        return response.data;
    }
};

export default commissionsApi;
