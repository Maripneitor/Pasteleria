import axios from 'axios';

// URL del backend (Variable de entorno o hardcoded para dev)
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api = axios.create({
    baseURL: API_URL,
    withCredentials: true,
});

// Interceptor para incluir Token automáticamente si existe
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;
