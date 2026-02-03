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
// Interceptor: Manejo de Errores Global y UI Friendly
client.interceptors.response.use(
    (response) => {
        // [DEBUG] Success
        const requestId = response.headers['x-request-id'] || response.config.requestId;
        if (import.meta.env.VITE_DEBUG_MODE === 'true') {
            const duration = Date.now() - (response.config.metadata?.startTime || Date.now());
            window.dispatchEvent(new CustomEvent('debug:request', {
                detail: {
                    id: response.config.metadata?.internalId,
                    requestId,
                    status: response.status,
                    duration,
                    type: 'res'
                }
            }));
        }
        return response;
    },
    (error) => {
        // [DEBUG] Error
        const requestId = error.response?.headers?.['x-request-id'] || error.response?.data?.requestId;
        if (import.meta.env.VITE_DEBUG_MODE === 'true') {
            const duration = Date.now() - (error.config?.metadata?.startTime || Date.now());
            window.dispatchEvent(new CustomEvent('debug:request', {
                detail: {
                    id: error.config?.metadata?.internalId,
                    url: error.config?.url,
                    method: error.config?.method?.toUpperCase(),
                    requestId,
                    status: error.response?.status || 0,
                    errorMessage: error.response?.data?.message || error.message,
                    error: true,
                    duration,
                    type: 'err'
                }
            }));
        }

        // 1. Mostrar mensaje amigable (toast) en vez de error técnico
        // Salvo que la petición cancele explícitamente el toast (config.skipToast) - future proofing
        if (!error.config?.skipToast) {
            const msg = friendlyError(error);
            // Append Request ID if available for tracking
            const displayMsg = requestId ? `${msg} (ReqID: ${requestId.slice(0, 6)})` : msg;
            toast.error(displayMsg);
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

// Add Request Interceptor for Timing/Tracking
client.interceptors.request.use((config) => {
    config.metadata = { startTime: Date.now(), internalId: Math.random().toString(36).substring(7) };

    if (import.meta.env.VITE_DEBUG_MODE === 'true') {
        window.dispatchEvent(new CustomEvent('debug:request', {
            detail: {
                id: config.metadata.internalId,
                url: config.url,
                method: config.method?.toUpperCase(),
                type: 'req'
            }
        }));
    }

    const token = getToken(); // Uses migration logic automatically
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => Promise.reject(error));

export default client;
