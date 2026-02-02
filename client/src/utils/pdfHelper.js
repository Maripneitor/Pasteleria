import toast from 'react-hot-toast';

/**
 * Handles PDF download response.
 * Checks if the response is actually a JSON error (e.g. 401, 500) before trying to open as Blob.
 * @param {Promise} apiCall - The async function calling the API (e.g. ordersApi.downloadPdf(id))
 * @param {string} [fileName] - Optional filename for download (if we implemented forceful download)
 */
export const handlePdfResponse = async (apiCall) => {
    let loadingToast = toast.loading('Generando PDF...');
    try {
        const res = await apiCall();

        // Axios returns blob in res.data, headers in res.headers
        const contentType = res.headers['content-type'] || res.headers['Content-Type'];

        if (contentType && contentType.includes('application/json')) {
            // It's an error disguised as a blob response (common in Axios blobType requests)
            const text = await res.data.text();
            let errorMessage = 'Error generando PDF';
            try {
                const json = JSON.parse(text);
                errorMessage = json.message || errorMessage;
            } catch { /* ignore parse error */ }

            throw new Error(errorMessage);
        }

        // It is a PDF
        const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
        window.open(url, '_blank');
        toast.dismiss(loadingToast);
        toast.success('PDF abierto');

    } catch (error) {
        toast.dismiss(loadingToast);
        console.error("PDF Error:", error);

        // Check for 401/403 specifically if axios error
        if (error.response?.status === 401) {
            toast.error("Sesión expirada o no autorizado.");
        } else {
            toast.error(error.message || "Error al descargar PDF");
        }
    }
};
