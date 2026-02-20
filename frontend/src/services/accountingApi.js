import client from '../config/axios';

const accountingApi = {
    /**
     * Sends a PDF report generated in the frontend to the backend to be emailed.
     * @param {Blob} pdfBlob - The PDF file as a blob.
     * @param {string} emailDestino - Recipient email.
     * @param {string} fecha - Date of the report.
     * @param {string} titulo - Title of the report.
     */
    sendReportByEmail: async (pdfBlob, emailDestino, fecha, titulo) => {
        const formData = new FormData();
        formData.append('pdf', pdfBlob, `Balance_${fecha}.pdf`);
        formData.append('emailDestino', emailDestino);
        formData.append('fecha', fecha);
        formData.append('titulo', titulo);

        const { data } = await client.post('/accounting/enviar-reporte', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return data;
    }
};

export default accountingApi;
