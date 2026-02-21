/**
 * authService.js
 * Servicio de autenticación para páginas legacy (Login.jsx, Dashboard.jsx).
 * Las páginas nuevas deben usar useAuth() del AuthContext.
 */
import api from '@/config/axios';

const authService = {
    /**
     * Inicia sesión. Guarda el token en localStorage.
     * @param {string} email
     * @param {string} password
     * @returns {Promise<{token: string, user: object}>}
     */
    login: async (email, password) => {
        const res = await api.post('/auth/login', { email, password });
        const { token, user } = res.data;
        if (token) localStorage.setItem('token', token);
        return { token, user };
    },

    /**
     * Cierra sesión y limpia el token.
     */
    logout: () => {
        localStorage.removeItem('token');
        window.location.href = '/login';
    },

    /**
     * Obtiene el usuario actual decodificando el JWT almacenado.
     * @returns {object|null}
     */
    getCurrentUser: () => {
        const token = localStorage.getItem('token');
        if (!token) return null;
        try {
            const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
            return JSON.parse(window.atob(base64));
        } catch {
            return null;
        }
    },

    /**
     * Devuelve true si hay una sesión activa.
     */
    isAuthenticated: () => !!localStorage.getItem('token'),
};

export default authService;
