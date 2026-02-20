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
                if (json.details) errorMessage += `: ${json.details}`;
            } catch { /* ignore parse error */ }

            throw new Error(errorMessage);
        }

        // Check for suspiciously small blobs (likely error text sent as application/pdf by mistake or empty)
        if (res.data.size < 100) {
            const text = await res.data.text();
            console.error("PDF Blob too small, potential error:", text);
            try {
                // Try to parse if it's JSON
                const json = JSON.parse(text);
                if (json.message) throw new Error(json.message);
            } catch (e) {
                if (e.message && e.message !== 'Unexpected token') throw e; // rethrow if it was a json parse success that threw error
            }
            // If not JSON, maybe just text error
            if (text.includes('Error') || text.includes('Cannot')) {
                throw new Error(`Error del servidor: ${text.substring(0, 50)}...`);
            }
        }

        // It is a PDF
        const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
        window.open(url, '_blank');
        toast.dismiss(loadingToast);
        toast.success('PDF abierto');

    } catch (error) {
        toast.dismiss(loadingToast);

        let errorMsg = error.message || "Error al descargar PDF";

        // Si el error contiene una respuesta en formato Blob (común con responseType: 'blob')
        if (error.response?.data instanceof Blob) {
            try {
                const text = await error.response.data.text();
                const json = JSON.parse(text);
                errorMsg = json.details || json.message || errorMsg;
            } catch (e) {
                console.error("No se pudo parsear el error del Blob", e);
            }
        } else if (error.response?.data?.message) {
            errorMsg = error.response.data.message;
        }

        console.error("PDF Error Detailed:", error);
        toast.error(errorMsg);
    }
};

/**
 * Generates a PDF directly in the browser from a DOM element.
 * Useful for "what you see is what you get" downloads.
 * @param {HTMLElement} element - The DOM element to capture.
 * @param {string} fileName - The name of the resulting file.
 */
export const generatePdfFromDom = async (element, fileName = 'documento.pdf') => {
    if (!element) {
        toast.error('No se encontró el elemento para generar el PDF');
        return;
    }

    // Dynamic import to avoid bundling if not used or to handle library loading
    // In this project it's already in package.json, but using import() is cleaner for heavy libs
    const loadHtml2Pdf = async () => {
        const { default: html2pdf } = await import('html2pdf.js');
        return html2pdf;
    };

    const loadingToast = toast.loading('Preparando descarga...');
    try {
        const html2pdf = await loadHtml2Pdf();

        const opt = {
            margin: [10, 10],
            filename: fileName,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        // Execution
        await html2pdf().set(opt).from(element).save();

        toast.dismiss(loadingToast);
        toast.success('Descarga completada');
    } catch (error) {
        toast.dismiss(loadingToast);
        console.error("html2pdf Error:", error);
        toast.error('Error al generar PDF en el cliente');
    }
};

/**
 * Generates a PDF blob from a DOM element without downloading it.
 * @param {HTMLElement} element - The DOM element.
 * @returns {Promise<Blob>} - The PDF blob.
 */
export const getPdfBlobFromDom = async (element) => {
    if (!element) throw new Error('Elemento no encontrado');

    const { default: html2pdf } = await import('html2pdf.js');

    const opt = {
        margin: [10, 10],
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    return await html2pdf().set(opt).from(element).output('blob');
};
