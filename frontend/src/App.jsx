import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Páginas Existentes
// Core Components & Features
import LoginPage from '@/features/auth/views/LoginPage';
import RegisterPage from '@/features/auth/views/RegisterPage';
import DashboardPage from '@/features/dashboard/views/DashboardPage';
import WhatsAppPage from '@/features/whatsapp/views/WhatsAppPage';
import FoliosPage from '@/features/folios/views/FoliosPage';
import NewFolioWizard from '@/features/folios/views/NewFolioWizard';
import FolioDetailPage from '@/features/folios/views/FolioDetailPage';
import CatalogsPage from '@/features/catalogs/views/CatalogsPage';
import ReportsPage from '@/features/reports/views/ReportsPage';

// Other Pages (Pending Migration)
import CashPage from '@/features/cash/views/CashPage';
import CashCountForm from '@/features/cash/components/CashCountForm';
import ExpenseForm from '@/features/cash/components/ExpenseForm';
import ActivationLockPage from './pages/ActivationLockPage';
import CalendarPage from './pages/CalendarPage';
import TeamPage from './pages/TeamPage';
import BranchesPage from './pages/branches/BranchesPage';
import ClientsPage from '@/features/clients/views/ClientsPage';
import EditOrderPage from './pages/EditOrderPage';
import ProductionPage from './pages/ProductionPage';
import OrderDetailsProduction from './pages/OrderDetailsProduction';
import AuditPage from './pages/AuditPage';
import NotFound from './pages/NotFound';
import LocalSettings from './pages/LocalSettings';
import AdminSaboresPage from './pages/admin/AdminSaboresPage';
import PendingUsersPage from './pages/PendingUsersPage';
import CommissionsPage from './pages/CommissionsPage';
import BrandingPage from './pages/admin/BrandingPage';
import TenantsPage from './pages/admin/TenantsPage';

import MainLayout from '@/components/MainLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { OrderProvider } from '@/context/OrderContext';

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

        {/* 🔒 Rutas Protegidas */}
        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            <Route index element={<DashboardPage />} />
            {/* 🛠 Wizard & Operatives (All Roles) */}
            <Route path="pedidos/nuevo" element={
              <OrderProvider>
                <NewFolioWizard />
              </OrderProvider>
            } />
            <Route path="folios/new" element={<Navigate to="/pedidos/nuevo" replace />} />

            <Route path="pedidos" element={<FoliosPage />} />
            <Route path="folios" element={<Navigate to="/pedidos" replace />} />

            <Route path="folios/:id" element={<FolioDetailPage />} />
            <Route path="pedidos/:id" element={<FolioDetailPage />} />

            {/* Legacy Edit Route - could be migrated later */}
            {/* Full Edit Wizard */}
            <Route path="pedidos/:id/editar" element={
              <OrderProvider>
                <EditOrderPage />
              </OrderProvider>
            } />

            <Route path="sucursales" element={<BranchesPage />} />
            <Route path="branches" element={<Navigate to="/sucursales" replace />} />
            <Route path="caja" element={<CashPage />} />
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
            <Route path="configuracion" element={<LocalSettings />} />
            <Route path="usuarios/pendientes" element={<PendingUsersPage />} />
            <Route path="admin/branding" element={<BrandingPage />} />

            {/* Sprint F3: Management */}
            <Route path="catalogs" element={<CatalogsPage />} />
            <Route path="clients" element={<ClientsPage />} />

            {/* SuperAdmin Management */}
            <Route path="admin/tenants" element={<TenantsPage />} />
            <Route path="admin/whatsapp" element={<WhatsAppPage />} />
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
