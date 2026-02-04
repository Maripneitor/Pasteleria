import axios from 'axios';
import toast from 'react-hot-toast';

// Create axios instance with default config
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
    withCredentials: true, // Important for cookies/sessions if used
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor: Attach Token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor: Handle Global Errors (401, etc)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Handle 401 Unauthorized (Session Expired)
        if (error.response && error.response.status === 401) {
            const currentPath = window.location.pathname;
            // Avoid loop if already on login
            if (currentPath !== '/login') {
                localStorage.removeItem('token');
                localStorage.removeItem('user'); // clear user data if stored
                toast.error('Sesión expirada. Por favor inicia sesión nuevamente.');

                // Optional: Redirect to login
                // window.location.href = '/login'; 
                // Better: Let the Router handle it via AuthContext state, 
                // but if we need force:
                setTimeout(() => {
                    window.location.href = '/login';
                }, 1500);
            }
        }

        // Return error for local handling
        return Promise.reject(error);
    }
);

export default api;
