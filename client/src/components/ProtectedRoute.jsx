import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = () => {
    // Verificamos si existe el token en el almacenamiento local
    const token = localStorage.getItem('token');

    // Si no hay token, lo mandamos al Login
    if (!token) {
        return <Navigate to="/login" replace />;
    }

    // Si hay token, dejamos pasar a las rutas hijas (Outlet)
    return <Outlet />;
};

export default ProtectedRoute;
