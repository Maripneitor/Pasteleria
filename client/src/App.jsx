import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import MainLayout from './layouts/MainLayout';
import DashboardHome from './pages/DashboardHome';
import OrdersPage from './pages/OrdersPage';
import UserManagement from './pages/UserManagement';
import CashRegister from './pages/CashRegister';
import AuditLog from './pages/AuditLog';
import ProductionCalendar from './pages/ProductionCalendar';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<MainLayout />}>
              <Route index element={<DashboardHome />} />
              <Route path="orders" element={<OrdersPage />} />
              <Route path="users" element={<UserManagement />} />
              <Route path="cash-register" element={<CashRegister />} />
              <Route path="audit" element={<AuditLog />} />
              <Route path="production" element={<ProductionCalendar />} />
              {/* Fallback route */}
              <Route path="*" element={<div>Página no encontrada</div>} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
