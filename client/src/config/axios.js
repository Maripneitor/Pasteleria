import axios from 'axios';

import { getToken, clearToken } from '../utils/auth';

const client = axios.create({
    baseURL: (() => {
        const envUrl = import.meta.env.VITE_API_URL;
        if (!envUrl) return '/api';

        // Remove specific unwanted suffix if present
        let url = envUrl.replace(/\/apiservices\/?$/, '');

        // Remove trailing slash
        url = url.replace(/\/$/, '');

        // Identify if it already ends in /api
        if (url.endsWith('/api')) return url;

        // Should we force /api suffix? 
        // If the user provided 'http://localhost:3000', we likely want 'http://localhost:3000/api'
        // If they provided '/api', we returned it above.
        // If they provided '', we returned '/api' above.
        return `${url}/api`;
    })(),
    headers: {
        'Content-Type': 'application/json'
    }
});

import toast from 'react-hot-toast';
import { friendlyError } from '../utils/uiMessages';

// 🛡️ INTERCEPTOR (El Portero de Salida)
client.interceptors.request.use((config) => {
    const token = getToken(); // Uses migration logic automatically
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => Promise.reject(error));

// Interceptor: Manejo de Errores Global y UI Friendly
client.interceptors.response.use(
    (response) => response,
    (error) => {
        // 1. Mostrar mensaje amigable (toast) en vez de error técnico
        // Salvo que la petición cancele explícitamente el toast (config.skipToast) - future proofing
        if (!error.config?.skipToast) {
            const msg = friendlyError(error);
            // Evitar duplicados si hay muchos errores seguidos? (Toast libraries usually handle this)
            toast.error(msg);
        }

        // 2. Manejo de Auth (401)
        if (error.response?.status === 401) {
            clearToken();
            // Optional delay to let user read toast before redirect? No, immediate is safer.
            window.location.href = '/login';
        }

        // Log técnico en desarrollo
        if (import.meta.env.DEV) {
            console.error("❌ API Error:", error.response?.data || error.message);
        }

        return Promise.reject(error);
    }
);

export default client;
