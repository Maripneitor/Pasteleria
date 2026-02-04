import client from '../config/axios';
import { setToken, clearToken } from '../utils/auth';

// URL base del backend. En desarrollo con Vimte, normalmente se usa un proxy o la URL directa.
// Si usamos docker-compose, el navegador del cliente no ve "server", ve localhost:3000.

const login = async (email, password) => {
    try {
        const response = await client.post('/auth/login', { email, password });
        if (response.data.token) {
            localStorage.setItem('user', JSON.stringify(response.data));
            // Guardar token y limpiar legacy
            setToken(response.data.token);
        }
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : { message: 'Error de red' };
    }
};

const logout = () => {
    clearToken();
};

const getCurrentUser = () => {
    return JSON.parse(localStorage.getItem('user'));
};

const authService = {
    login,
    logout,
    getCurrentUser
};

export default authService;
