/**
 * Middleware para filtrar datos por Tenant (Multi-tenancy)
 * basado en el rol del usuario.
 * 
 * Admin: Ve todo (scope vacío)
 * Owner/Employee: Ve solo su tenantId
 */
const tenantScope = (req, res, next) => {
    try {
        const user = req.user;

        if (!user) {
            // Si no hay usuario (auth falló o no se usó), bloquear o dejar pasar vacío?
            // Mejor asumir seguro: si no hay user, deny all o empty set?
            // AuthMiddleware debe correr antes.
            return res.status(401).json({ message: 'Auth requerido para scope' });
        }

        // Admin ve todo
        if (user.role === 'admin') {
            req.tenantFilter = {};
            req.isGlobalAdmin = true;
        } else {
            // Owner y Employee filtran por su tenantId
            // Si tenantId es null (legacy), filtrar por null o ID 1?
            // Asumimos tenantId obligatorio en tokens nuevos
            const tenantId = user.tenantId || 1;
            req.tenantFilter = { tenantId: tenantId };
            req.isGlobalAdmin = false;
        }

        next();
    } catch (e) {
        console.error("TenantScope Error:", e);
        res.status(500).json({ message: "Error de seguridad (Scope)" });
    }
};

module.exports = tenantScope;
