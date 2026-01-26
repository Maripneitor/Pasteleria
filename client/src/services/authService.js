import api from './api';

// URL base del backend. En desarrollo con Vimte, normalmente se usa un proxy o la URL directa.
// Si usamos docker-compose, el navegador del cliente no ve "server", ve localhost:3000.

const login = async (email, password) => {
    try {
        const response = await api.post('/auth/login', { email, password });
        if (response.data.token) {
            localStorage.setItem('user', JSON.stringify(response.data));
            // Guardar token por separado también para el interceptor si se desea
            localStorage.setItem('token', response.data.token);
        }
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : { message: 'Error de red' };
    }
};

const logout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
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
