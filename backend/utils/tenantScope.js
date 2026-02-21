exports.buildTenantWhere = (req) => {
    // 1. Si eres SUPER ADMIN (El Creador del Software)
    if (req.user && req.user.role === 'SUPER_ADMIN') {
        // Modo Vigilancia Específico: Si en el frontend filtras por una sucursal o cliente
        if (req.query.tenantId) {
            return { tenantId: req.query.tenantId };
        }
        // God Mode Total: Si no mandas filtro, ves TODOS los folios de todos los clientes
        return {};
    }

    // 2. Si eres un Cliente Normal (Dueño o Empleado)
    // ESTÁN ENCERRADOS EN SU PROPIA BURBUJA
    if (!req.user || !req.user.tenantId) {
        throw new Error('Fuga de datos prevenida: Usuario sin Tenant asignado');
    }

    return { tenantId: req.user.tenantId };
};
