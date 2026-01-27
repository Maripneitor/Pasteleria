import axios from 'axios';

const client = axios.create({
    baseURL: 'http://localhost:3000/api',
    headers: {
        'Content-Type': 'application/json'
    }
});

// 🛡️ INTERCEPTOR (El Portero de Salida)
// Antes de que salga CUALQUIER petición, le pegamos el token en la frente.
client.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

// 🛡️ INTERCEPTOR (El Portero de Entrada)
// Si el token expiró (Error 401), cerramos sesión automáticamente.
client.interceptors.response.use((response) => {
    return response;
}, (error) => {
    if (error.response && error.response.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login'; // Expulsar al usuario
    }
    return Promise.reject(error);
});

export default client;
