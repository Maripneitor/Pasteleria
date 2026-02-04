import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Páginas Existentes
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ActivationLockPage from './pages/ActivationLockPage'; // Sprint 4
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
import OrderDetailsProduction from './pages/OrderDetailsProduction';
import AuditPage from './pages/AuditPage';
import NotFound from './pages/NotFound';

// 🆕 Módulos Operativos (UI Forms)
import LocalSettings from './pages/LocalSettings';
import CashCountForm from './pages/ops/CashCountForm';
import ExpenseForm from './pages/ops/ExpenseForm';

// Admin Pages (Placeholders)
import AdminStatsPage from './pages/admin/AdminStatsPage';
import AdminSaboresPage from './pages/admin/AdminSaboresPage';
import PendingUsersPage from './pages/PendingUsersPage';
import CommissionsPage from './pages/CommissionsPage';
import ReportsPage from './pages/ReportsPage';
import BrandingPage from './pages/admin/BrandingPage';

import MainLayout from './components/MainLayout';
import ProtectedRoute from './components/ProtectedRoute';

// DebugPanel removed (diagnostic mode off)

function App() {
  return (
    <>

      <Toaster position="top-right" toastOptions={{ className: '', style: { border: '1px solid #fbcfe8', padding: '16px', color: '#831843' } }} />

      <Routes>
        {/* Rutas Públicas */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/registro" element={<RegisterPage />} />
        <Route path="/activacion" element={<ActivationLockPage />} /> {/* Sprint 4 */}
        <Route path="/admin/whatsapp" element={<WhatsAppPage />} />

        {/* 🔒 Rutas Protegidas */}
        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            <Route index element={<DashboardPage />} />
            {/* 🛠 Wizard & Operatives (All Roles) */}
            <Route path="pedidos/nuevo" element={<NewOrderPage />} />
            <Route path="pedidos" element={<OrdersPage />} />
            <Route path="pedidos/:id/editar" element={<EditOrderPage />} />
            <Route path="caja" element={<CashRegister />} />
            <Route path="produccion" element={<ProductionPage />} />
            <Route path="produccion/detalle/:id" element={<OrderDetailsProduction />} />
            <Route path="calendario" element={<CalendarPage />} />
            <Route path="calendar" element={<Navigate to="/calendario" replace />} />
            <Route path="caja/arqueo" element={<CashCountForm />} />
            <Route path="caja/gastos" element={<ExpenseForm />} />
          </Route>
        </Route>

        {/* 🛡️ Rutas Admin / Owner */}
        <Route element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'OWNER']} />}>
          <Route element={<MainLayout />}>
            <Route path="usuarios" element={<TeamPage />} />
            <Route path="admin/reports" element={<ReportsPage />} />
            <Route path="admin/stats" element={<Navigate to="/admin/reports" replace />} />
            <Route path="admin/sabores" element={<AdminSaboresPage />} />
            <Route path="admin/comisiones" element={<CommissionsPage />} />
            <Route path="auditoria" element={<AuditPage />} />
            <Route path="auditoria" element={<AuditPage />} />
            <Route path="configuracion" element={<LocalSettings />} />
            <Route path="usuarios/pendientes" element={<PendingUsersPage />} />
            <Route path="admin/branding" element={<BrandingPage />} />
          </Route>
        </Route>

        {/* Owner Specific (if separated) or merged above if allowedRoles includes OWNER */}
        {/* We need to ensure the route guard above accepts OWNER. 
            Currently: allowedRoles={['SUPER_ADMIN', 'ADMIN']}
            I will update it to include OWNER.
        */}

        {/* 404 - Catch All */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

export default App;
