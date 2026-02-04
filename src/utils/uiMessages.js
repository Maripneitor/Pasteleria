export function friendlyError(err) {
    const status = err?.response?.status;
    const apiMsg = err?.response?.data?.message;

    if (status === 401) return "Tu sesión expiró. Inicia sesión de nuevo.";
    if (status === 403) return "No tienes permisos para esta acción.";
    if (status === 404) return "Esta función aún no está disponible o la ruta no existe.";
    if (status >= 500) return "El sistema tuvo un problema. Intenta de nuevo en un momento.";

    // Network Error
    if (err.message === 'Network Error') return "No pudimos conectar con el servidor. Revisa tu conexión.";

    return apiMsg || "No se pudo completar la operación. Revisa tu conexión.";
}
