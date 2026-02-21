import client from '@/config/axios';

const reportsApi = {
    /**
     * Triggers the backend email sending process
     */
    sendDailyCut: async (date, force = false) => {
        const response = await client.post('/reports/daily-cut', { date, force });
        return response.data;
    },

    /**
     * Downloads/Opens the PDF of the daily cut
     */
    getDailyCutPdf: async (date) => {
        const response = await client.get('/reports/daily-cut/preview', {
            params: { date },
            responseType: 'blob'
        });
        return response; // Return full response for handlePdfResponse
    }
};

export default reportsApi;
