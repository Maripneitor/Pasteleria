import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = ({ allowedRoles = [] }) => {
    // Verificamos si existe el token
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    // Role Check
    if (allowedRoles.length > 0 && userStr) {
        let isAuthorized = false;
        try {
            const user = JSON.parse(userStr);
            if (allowedRoles.includes(user.role)) {
                isAuthorized = true;
            }
        } catch (e) {
            console.error("Error parsing user for RBAC", e);
            // Unauthorized by default if error
        }

        if (!isAuthorized) {
            return <Navigate to="/" replace />;
        }
    }

    return <Outlet />;
};

export default ProtectedRoute;
