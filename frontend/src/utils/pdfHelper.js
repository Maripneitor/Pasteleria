import toast from 'react-hot-toast';

export const handlePdfResponse = async (apiCall, defaultFileName = 'documento.pdf') => {
    let loadingToast = toast.loading('Generando PDF...');
    try {
        const res = await apiCall();
        const contentType = res.headers['content-type'] || res.headers['Content-Type'];

        // Si el servidor responde con JSON, es un error
        if (contentType && contentType.includes('application/json')) {
            const text = await res.data.text();
            const json = JSON.parse(text);
            throw new Error(json.message || 'Error en el servidor');
        }

        // Verificación de seguridad para archivos vacíos
        if (res.data.size < 100) {
            throw new Error("El archivo se generó vacío. Revisa que haya datos en esa fecha.");
        }

        // --- LÓGICA DE DESCARGA FORZADA ---
        const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
        const link = document.createElement('a');
        link.href = url;
        
        // Intentar obtener el nombre del archivo desde los encabezados o usar el defecto
        const contentDisposition = res.headers['content-disposition'];
        let fileName = defaultFileName;
        if (contentDisposition && contentDisposition.includes('filename=')) {
            fileName = contentDisposition.split('filename=')[1].replace(/"/g, '');
        }

        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click(); // Dispara la descarga

        // Limpieza
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        toast.dismiss(loadingToast);
        toast.success('Descarga iniciada');

    } catch (error) {
        toast.dismiss(loadingToast);
        console.error("PDF Error:", error);
        toast.error(error.message || "Error al descargar el PDF");
    }
};