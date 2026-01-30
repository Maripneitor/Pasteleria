import axios from 'axios';

import { getToken, clearToken } from '../utils/auth';

const client = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '/api',
    headers: {
        'Content-Type': 'application/json'
    }
});

// 🛡️ INTERCEPTOR (El Portero de Salida)
// Antes de que salga CUALQUIER petición, le pegamos el token en la frente.
client.interceptors.request.use((config) => {
    const token = getToken(); // Uses migration logic automatically
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

// Interceptor: Si el server dice "401 No Autorizado", nos saca
client.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            clearToken(); // Cleans up everything
            window.location.href = '/login';
        }

        return Promise.reject(error);
    }
);

export default client;
