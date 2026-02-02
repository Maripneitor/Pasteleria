import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Páginas Existentes
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import NewOrderPage from './pages/NewOrderPage';
import CalendarPage from './pages/CalendarPage';
import TeamPage from './pages/TeamPage';
import WhatsAppPage from './pages/WhatsAppPage';

// 🆕 Páginas Nuevas (Routing Repair)
import OrdersPage from './pages/OrdersPage';
import EditOrderPage from './pages/EditOrderPage';
import CashRegister from './pages/CashRegister';
import ProductionPage from './pages/ProductionPage'; // Nuevo Kanban
import AuditPage from './pages/AuditPage';
import NotFound from './pages/NotFound';

// 🆕 Módulos Operativos (UI Forms)
import LocalSettings from './pages/LocalSettings';
import CashCountForm from './pages/ops/CashCountForm';
import ExpenseForm from './pages/ops/ExpenseForm';

// Admin Pages (Placeholders)
import AdminStatsPage from './pages/admin/AdminStatsPage';
import AdminSaboresPage from './pages/admin/AdminSaboresPage';
import CommissionsPage from './pages/CommissionsPage';

import MainLayout from './components/MainLayout';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <>
      <Toaster position="top-right" toastOptions={{ className: '', style: { border: '1px solid #fbcfe8', padding: '16px', color: '#831843' } }} />

      <Routes>
        {/* Rutas Públicas */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/registro" element={<RegisterPage />} />
        <Route path="/admin/whatsapp" element={<WhatsAppPage />} />

        {/* 🔒 Rutas Protegidas */}
        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            <Route index element={<DashboardPage />} />

            {/* 🛠 Wizard de Pedidos Refactorizado */}
            <Route path="pedidos/nuevo" element={<NewOrderPage />} />

            {/* 🔗 Rutas Reparadas (Spanish URLs) */}
            {/* 🔗 Rutas Reparadas (Spanish URLs) */}
            <Route path="pedidos" element={<OrdersPage />} />
            <Route path="pedidos/:id/editar" element={<EditOrderPage />} />
            <Route path="caja" element={<CashRegister />} />
            <Route path="produccion" element={<ProductionPage />} />
            <Route path="usuarios" element={<TeamPage />} />

            {/* 🛡️ Rutas Admin (Placeholders fix 404) */}
            <Route path="admin/stats" element={<AdminStatsPage />} />
            <Route path="admin/sabores" element={<AdminSaboresPage />} />
            <Route path="comisiones" element={<CommissionsPage />} />

            <Route path="auditoria" element={<AuditPage />} />
            <Route path="calendario" element={<CalendarPage />} />
            <Route path="calendar" element={<Navigate to="/calendario" replace />} />

            {/* ⚙️ Nuevas Rutas Operativas */}
            <Route path="caja/arqueo" element={<CashCountForm />} />
            <Route path="caja/gastos" element={<ExpenseForm />} />
            <Route path="configuracion" element={<LocalSettings />} />
          </Route>
        </Route>

        {/* 404 - Catch All */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

export default App;
