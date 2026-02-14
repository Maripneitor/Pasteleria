/**
 * SISTEMA CENTRAL DE PERMISOS
 * Define matriz completa de permisos por rol
 */

const PERMISSIONS = {
    OWNER: {
        name: 'Dueño',
        routes: ['*'], // Acceso total a su tenant
        abilities: [
            'view_all', 'create_all', 'update_all', 'delete_all',
            'manage_branches', 'manage_commissions', 'manage_users',
            'change_pastry_name', 'view_reports',
            'manage_tenant_config', 'view_all_branches'
        ],
        forbidden: []
    },

    ADMIN: {
        name: 'Admin General',
        routes: ['*'], // Acceso cross-tenant
        abilities: [
            'view_all', 'view_reports', 'manage_branches', 'manage_users',
            'manage_commissions', 'view_all_tenants'
        ],
        forbidden: [
            'change_platform_settings', 'delete_tenant', 'manage_super_admin'
        ]
    },

    EMPLOYEE: {
        name: 'Empleado',
        routes: [
            '/dashboard', '/dashboard-empleado',
            '/pedidos', '/pedidos/:id', // Solo lectura
            '/folios', '/folios/:id', // Solo lectura
            '/comandas/generar',
            '/mi-perfil',
            '/produccion', // Ver su trabajo
            '/calendario' // Ver calendario
        ],
        abilities: [
            'view_orders', 'view_order_detail',
            'view_folios', 'view_folio_detail',
            'generate_comanda',
            'update_own_profile',
            'view_own_production',
            'view_calendar'
        ],
        forbidden: [
            'create_order', 'update_order', 'delete_order',
            'create_folio', 'update_folio', 'delete_folio',
            'view_clients', 'view_products', 'view_inventory',
            'view_reports', 'view_branches', 'manage_anything',
            'view_users', 'create_user', 'view_cash',
            'change_commissions', 'manage_tenant_config'
        ]
    },

    SUPER_ADMIN: {
        name: 'Super Administrador',
        routes: ['*'],
        abilities: ['*'],
        forbidden: []
    }
};

/**
 * Verifica si un rol tiene permiso para acceder a una ruta
 * @param {string} userRole - Rol del usuario (OWNER, ADMIN, EMPLOYEE, SUPER_ADMIN)
 * @param {string} route - Ruta a verificar (ej: '/sucursales/nueva')
 * @param {string} ability - Habilidad específica a verificar (opcional)
 * @returns {boolean} - true si tiene permiso, false si no
 */
function hasPermission(userRole, route, ability = null) {
    const rolePerms = PERMISSIONS[userRole];
    if (!rolePerms) return false;

    // OWNER y SUPER_ADMIN tienen acceso total
    if (userRole === 'OWNER' || userRole === 'SUPER_ADMIN') {
        return true;
    }

    // Verificar si la ruta está permitida
    const routeAllowed = rolePerms.routes.some(r => {
        if (r === '*') return true;
        if (r.endsWith('/*')) {
            const baseRoute = r.slice(0, -2);
            return route.startsWith(baseRoute);
        }
        return r === route;
    });

    if (!routeAllowed) return false;

    // Si se especifica una habilidad, verificarla
    if (ability) {
        // Si está en forbidden, denegar
        if (rolePerms.forbidden.includes(ability)) return false;
        // Si está en abilities, permitir
        return rolePerms.abilities.includes(ability);
    }

    return true;
}

/**
 * Verifica si un rol tiene una habilidad específica
 * @param {string} userRole - Rol del usuario
 * @param {string} ability - Habilidad a verificar
 * @returns {boolean}
 */
function hasAbility(userRole, ability) {
    const rolePerms = PERMISSIONS[userRole];
    if (!rolePerms) return false;

    if (userRole === 'OWNER' || userRole === 'SUPER_ADMIN') {
        return true;
    }

    if (rolePerms.forbidden.includes(ability)) {
        return false;
    }

    return rolePerms.abilities.includes(ability);
}

/**
 * Obtiene todas las rutas permitidas para un rol
 * @param {string} userRole - Rol del usuario
 * @returns {string[]} - Array de rutas permitidas
 */
function getAllowedRoutes(userRole) {
    const rolePerms = PERMISSIONS[userRole];
    if (!rolePerms) return [];

    return rolePerms.routes;
}

/**
 * Obtiene todas las habilidades de un rol
 * @param {string} userRole - Rol del usuario
 * @returns {string[]} - Array de habilidades
 */
function getAllowedAbilities(userRole) {
    const rolePerms = PERMISSIONS[userRole];
    if (!rolePerms) return [];

    return rolePerms.abilities;
}

module.exports = {
    PERMISSIONS,
    hasPermission,
    hasAbility,
    getAllowedRoutes,
    getAllowedAbilities
};
