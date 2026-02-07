import { createContext, useContext, useState, useEffect } from 'react';
import api from '../config/axios';
import { clearToken, setToken } from '../utils/auth';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Helper: Decode JWT locally
    const decodeJwt = (token) => {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function (c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            return JSON.parse(jsonPayload);
        } catch (e) {
            console.error("Failed to decode JWT manually", e);
            return null;
        }
    };

    const mapUserFromPayload = (payload) => {
        if (!payload) return null;
        return {
            id: payload.id || payload.userId || payload.sub,
            name: payload.name || payload.fullName || payload.username || payload.email, // Fallback chain
            email: payload.email,
            role: (payload.role || 'USER').toUpperCase(),
            tenantId: payload.tenantId,
            branchId: payload.branchId
        };
    };

    // Load user on mount
    useEffect(() => {
        const loadUser = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                setLoading(false);
                return;
            }

            try {
                // A) Intentar fetch /auth/me
                const res = await api.get('/auth/me');
                setUser(res.data.user || res.data.data || res.data);
            } catch (error) {
                console.warn("Auth Load: /auth/me failed or 401. Falling back to JWT decode if possible.", error);

                // Si 401, el interceptor de axios ya hizo el trabajo sucio (limpiar token y redireccionar si aplica),
                // pero aquí debemos limpiar estado.
                if (error.response?.status === 401) {
                    localStorage.removeItem('token');
                    setUser(null);
                } else {
                    // B) Fallback a decodificación local (si fue error de red o 404, pero tenemos token)
                    const payload = decodeJwt(token);
                    if (payload) {
                        const mapped = mapUserFromPayload(payload);
                        setUser(mapped);
                    } else {
                        // Token inválido o corrupto
                        localStorage.removeItem('token');
                        setUser(null);
                    }
                }
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
            try {
                const res = await api.get('/auth/me');
                setUser(res.data.user || res.data.data || res.data);
            } catch (e) {
                // Fallback decode
                const payload = decodeJwt(token);
                if (payload) setUser(mapUserFromPayload(payload));
            }
        }
    };

    const logout = () => {
        clearToken(); // Helper removes token
        setUser(null);
        window.location.href = '/login';
    };

    // RBAC Helpers
    const hasRole = (roles) => {
        if (!user || !user.role) return false;
        // roles can be string (single) or array
        const rolesArray = Array.isArray(roles) ? roles : [roles];
        return rolesArray.includes(user.role);
    };

    const isOwnerOrAdmin = () => {
        return hasRole(['OWNER', 'ADMIN', 'SUPER_ADMIN']); // Include SUPER_ADMIN just in case
    };

    return (
        <AuthContext.Provider value={{
            user,
            loading,
            isAuthenticated: !!user,
            login,
            logout,
            hasRole,
            isOwnerOrAdmin
        }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
