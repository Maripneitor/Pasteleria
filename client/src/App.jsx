import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// 👇 ESTAS SON LAS IMPORTACIONES QUE FALTABAN
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import NewOrderPage from './pages/NewOrderPage';
import CalendarPage from './pages/CalendarPage';
import UsersPage from './pages/admin/UsersPage';

import MainLayout from './components/MainLayout';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <>
      {/* Configuración de Notificaciones Estilo "Pastelería" */}
      <Toaster
        position="top-right"
        toastOptions={{
          className: '',
          style: {
            border: '1px solid #fbcfe8',
            padding: '16px',
            color: '#831843',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            borderRadius: '12px',
            boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)',
          },
          success: {
            iconTheme: {
              primary: '#db2777',
              secondary: '#fff',
            },
          },
        }}
      />

      <Routes>
        {/* Rutas Públicas */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/registro" element={<RegisterPage />} />

        {/* 🔒 Rutas Protegidas */}
        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/pedidos/nuevo" element={<NewOrderPage />} />
            <Route path="/calendario" element={<CalendarPage />} />
            <Route path="/admin/usuarios" element={<UsersPage />} />
          </Route>
        </Route>

        {/* Redirección por defecto */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default App;
