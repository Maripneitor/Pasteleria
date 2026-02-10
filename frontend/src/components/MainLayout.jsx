import React, { useState } from 'react';
import { Menu, LogOut, LayoutDashboard, Calendar, PlusCircle, Users, Package, DollarSign, Settings, Bot, FileText, ClipboardList, BarChart, Tags, PieChart, Building, MessageCircle } from 'lucide-react';
import { useNavigate, useLocation, Link, Outlet } from 'react-router-dom';
import toast from 'react-hot-toast';
import AiAssistantTray from './AiAssistantTray';

// Extracted NavItem to avoid re-creation on every render
const NavItem = ({ path, icon: Icon, label, isActive, onClick }) => ( // eslint-disable-line
    <Link
        to={path}
        onClick={onClick}
        className={`flex items-center gap-3 px-4 py-3 rounded-l-xl transition-all duration-200 mb-1 ${isActive ? "bg-pink-100 text-pink-700 font-bold shadow-sm border-r-4 border-pink-500" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 font-medium"}`}
    >
        <Icon size={20} className={isActive ? 'text-pink-600' : 'text-gray-400'} />
        <span>{label}</span>
    </Link>
);

import { useAuth } from '../context/AuthContext';

// ... (NavItem remains same)

import { OrderProvider } from '../context/OrderContext';

const MainLayout = () => {
    const navigate = useNavigate();
    // ... (keep existing hooks)
    const location = useLocation();
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [isAiOpen, setIsAiOpen] = useState(false); // 🤖 Control de IA
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    // Read user from Context (Real RBAC)
    const { user, logout } = useAuth();

    // Allow opening from anywhere
    React.useEffect(() => {
        const handler = () => setIsAiOpen(true);
        window.addEventListener('open-ai-tray', handler);
        return () => window.removeEventListener('open-ai-tray', handler);
    }, []);

    // 🔐 Lógica de Logout Robusta
    const handleLogout = () => {
        if (window.confirm("¿Estás seguro que deseas cerrar sesión?")) {
            logout(); // Use Context Logout
            toast.success('Sesión cerrada. ¡Buen trabajo hoy!');
            navigate('/login');
        }
    };

    // Helper para estados activos
    const checkActive = (path) => {
        if (path === '/' && location.pathname === '/') return true;
        if (path !== '/' && location.pathname.startsWith(path)) return true;
        return false;
    };

    const handleNavClick = () => setIsMobileOpen(false);

    return (
        <OrderProvider>
            <div className="flex h-screen bg-gray-50 font-sans overflow-hidden">
                {/* 🟢 SIDEBAR (Navegación Vertical) */}
                <aside className={`
                    fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 flex flex-col transition-transform duration-300 ease-in-out md:static
                    ${isMobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'}
                `}>
                    {/* Logo Area */}
                    <div className="h-16 flex items-center px-6 border-b border-gray-100 bg-white/50 backdrop-blur-sm sticky top-0 z-10">
                        <h1 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-rose-600 tracking-tight flex items-center gap-2">
                            🧁 La Fiesta
                        </h1>
                    </div>

                    {/* Nav Links */}
                    <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto custom-scrollbar">
                        {/* 1. Bandeja de Entrada */}
                        <NavItem path="/" icon={LayoutDashboard} label="Bandeja de Entrada" isActive={checkActive('/')} onClick={handleNavClick} />

                        {/* 2. Ver Calendario */}
                        <NavItem path="/calendario" icon={Calendar} label="Ver Calendario" isActive={checkActive('/calendario')} onClick={handleNavClick} />

                        {/* 3. + Nuevo Folio (Primary Action) */}
                        <div className="my-4">
                            <Link
                                to="/pedidos/nuevo"
                                onClick={handleNavClick}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 
                                    ${checkActive('/pedidos/nuevo')
                                        ? "bg-pink-600 text-white shadow-lg shadow-pink-200 font-bold"
                                        : "bg-pink-50 text-pink-700 hover:bg-pink-100 font-bold"}`}
                            >
                                <PlusCircle size={20} />
                                <span>+ Nuevo Folio</span>
                            </Link>
                        </div>

                        {/* 4. Dictar Pedido (AI) */}
                        <button
                            onClick={() => { setIsAiOpen(true); handleNavClick(); }}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-l-xl transition-all duration-200 text-gray-600 hover:bg-purple-50 hover:text-purple-700 font-medium text-left"
                        >
                            <Bot size={20} className="text-purple-500" />
                            <span>Dictar Pedido</span>
                        </button>

                        <div className="px-4 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 mt-6">Administración</div>

                        {/* 5. Admin Usuarios */}
                        {['SUPER_ADMIN', 'ADMIN', 'OWNER'].includes(user?.role) && (
                            <NavItem path="/usuarios" icon={Users} label="Admin Usuarios" isActive={checkActive('/usuarios')} onClick={handleNavClick} />
                        )}

                        {/* Gestion de Dueños (SuperAdmin) */}
                        {['SUPER_ADMIN'].includes(user?.role) && (
                            <NavItem path="/admin/tenants" icon={Building} label="Gestión de Dueños" isActive={checkActive('/admin/tenants')} onClick={handleNavClick} />
                        )}

                        {/* WhatsApp Conexión */}
                        {['SUPER_ADMIN', 'OWNER'].includes(user?.role) && (
                            <NavItem path="/admin/whatsapp" icon={MessageCircle} label="Conexión WhatsApp" isActive={checkActive('/admin/whatsapp')} onClick={handleNavClick} />
                        )}

                        {/* 6. Gestión de Sabores y Rellenos */}
                        {['SUPER_ADMIN', 'ADMIN', 'OWNER'].includes(user?.role) && (
                            <NavItem path="/admin/sabores" icon={Tags} label="Gestión de Sabores" isActive={checkActive('/admin/sabores')} onClick={handleNavClick} />
                        )}

                        {/* 7. Estadísticas */}
                        {['SUPER_ADMIN', 'ADMIN', 'OWNER'].includes(user?.role) && (
                            <NavItem path="/admin/stats" icon={BarChart} label="Estadísticas" isActive={checkActive('/admin/stats')} onClick={handleNavClick} />
                        )}

                        {/* 8. Reporte de Comisiones */}
                        {['SUPER_ADMIN', 'ADMIN'].includes(user?.role) && (
                            <NavItem path="/admin/comisiones" icon={PieChart} label="Reporte de Comisiones" isActive={checkActive('/admin/comisiones')} onClick={handleNavClick} />
                        )}
                    </nav>

                    {/* Footer / Danger Zone */}
                    <div className="p-4 border-t border-gray-100 bg-gray-50/50">
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 px-4 py-3 w-full text-left text-red-600 hover:bg-red-50 hover:text-red-700 rounded-xl transition font-bold group"
                        >
                            <LogOut size={20} className="group-hover:scale-110 transition-transform" />
                            Cerrar Sesión
                        </button>
                    </div>
                </aside>

                {/* Overlay Mobile Sidebar */}
                {isMobileOpen && (
                    <div className="fixed inset-0 bg-black/50 z-30 md:hidden backdrop-blur-sm" onClick={() => setIsMobileOpen(false)} />
                )}

                {/* 🔵 CONTENIDO PRINCIPAL */}
                <div className="flex-1 flex flex-col h-screen overflow-hidden relative w-full">

                    {/* Header Desktop & Mobile */}
                    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 md:px-8 z-20 shadow-sm shrink-0">
                        <div className="flex items-center gap-4">
                            <button onClick={() => setIsMobileOpen(true)} className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-lg md:hidden">
                                <Menu size={24} />
                            </button>
                            <h2 className="font-bold text-gray-700 text-lg hidden md:block">Panel de Control</h2>
                        </div>

                        <div className="flex items-center gap-4">
                            {/* 🤖 TRIGGER IA */}
                            <button
                                onClick={() => setIsAiOpen(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded-full shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50 hover:scale-105 transition active:scale-95"
                            >
                                <Bot size={18} /> <span className="hidden sm:inline font-bold text-sm">Asistente IA</span>
                            </button>

                            <div className="relative">
                                <button
                                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                                    className="w-9 h-9 bg-pink-100 text-pink-600 rounded-full flex items-center justify-center font-bold text-sm border-2 border-white shadow-md hover:ring-2 ring-pink-300 transition-all"
                                >
                                    {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
                                </button>

                                {/* Profile Popover */}
                                {isProfileOpen && (
                                    <div className="absolute right-0 top-12 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 p-4 animate-in fade-in slide-in-from-top-2">
                                        <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-50">
                                            <div className="w-10 h-10 bg-pink-100 text-pink-600 rounded-full flex items-center justify-center font-bold">
                                                {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
                                            </div>
                                            <div className="overflow-hidden">
                                                <p className="font-bold text-gray-800 text-sm truncate">{user?.name || 'Usuario'}</p>
                                                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                                            </div>
                                        </div>

                                        <div className="space-y-1 mb-4">
                                            <div className="flex justify-between text-xs">
                                                <span className="text-gray-400">Rol Global</span>
                                                <span className={`font-bold px-2 py-0.5 rounded-full uppercase text-[10px] ${user?.role === 'SUPER_ADMIN' ? 'text-purple-700 bg-purple-100' :
                                                    user?.role === 'ADMIN' ? 'text-blue-700 bg-blue-100' :
                                                        'text-gray-700 bg-gray-100'
                                                    }`}>
                                                    {user?.role === 'SUPER_ADMIN' ? 'Super Admin' :
                                                        user?.role === 'ADMIN' ? 'Admin' :
                                                            user?.role || 'User'}
                                                </span>
                                            </div>
                                            {user?.tenantId && (
                                                <div className="flex justify-between text-xs">
                                                    <span className="text-gray-400">Sucursal</span>
                                                    <span className="font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">#{user.tenantId}</span>
                                                </div>
                                            )}
                                        </div>

                                        <button
                                            onClick={handleLogout}
                                            className="w-full py-2 bg-gray-50 hover:bg-gray-100 text-red-500 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
                                        >
                                            <LogOut size={14} /> Cerrar Sesión
                                        </button>
                                    </div>
                                )}

                                {/* Backdrop for click away */}
                                {isProfileOpen && (
                                    <div className="fixed inset-0 z-[-1]" onClick={() => setIsProfileOpen(false)} />
                                )}
                            </div>
                        </div>
                    </header>

                    {/* Main Scrollable Area */}
                    <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-gray-50 scroll-smooth relative">
                        <div className="max-w-7xl mx-auto min-h-full pb-20">
                            <Outlet />
                        </div>
                    </main>
                </div>

                {/* 🤖 COMPONENTE IA (Slide-over) */}
                <AiAssistantTray isOpen={isAiOpen} onClose={() => setIsAiOpen(false)} />
            </div>
        </OrderProvider>
    );
};

export default MainLayout;
