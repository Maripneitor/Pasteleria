import { createContext, useContext, useState, useEffect } from 'react';
import api from '../config/axios';
import { clearToken, setToken } from '../utils/auth';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Load user on mount
    useEffect(() => {
        const loadUser = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                setLoading(false);
                return;
            }

            try {
                // Ensure default header is set (axios config might do this, but safe to ensure)
                // api.defaults.headers.common['Authorization'] = `Bearer ${token}`; 
                // Using axios interceptor is better, assuming it's set up in config/axios.js
                // I'll trust config/axios.js deals with localStorage token or I need to check it.
                // Re-reading config/axios.js via tool if needed, but standard request:
                const res = await api.get('/auth/me');
                setUser(res.data);
            } catch (error) {
                console.error("Auth Load Error:", error);
                localStorage.removeItem('token');
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        loadUser();
    }, []);

    const login = async (token, userData) => {
        setToken(token); // Helper sets localStorage
        if (userData) {
            setUser(userData);
        } else {
            // Fetch if not provided partial
            const res = await api.get('/auth/me');
            setUser(res.data);
        }
    };

    const logout = () => {
        clearToken(); // Helper removes token
        setUser(null);
        // Optional: window.location.href = '/login' handled by component
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
