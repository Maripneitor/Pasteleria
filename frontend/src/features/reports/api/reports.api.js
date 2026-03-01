import client from '@/config/axios';

const reportsApi = {
    /**
     * Triggers the backend email sending process
     * @param {string} date - Fecha del corte (YYYY-MM-DD)
     * @param {boolean} force - Si es true, ignora el bloqueo de reenvío
     */
    sendDailyCut: async (date, force = false) => {
        // CAPA DE SEGURIDAD: Forzamos que 'force' sea estrictamente un booleano.
        // Si por error llega un evento de React (HTMLButtonElement), esto lo convertirá en 'false'
        // evitando el error de "Circular structure to JSON".
        const isForced = force === true;

        const response = await client.post('/reports/daily-cut', { 
            date, 
            force: isForced 
        });
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
        return response; // Retorna la respuesta completa para que pdfHelper.js maneje el Blob
    }
};

export default reportsApi;