import React, { useState } from 'react';
import { Menu, LogOut, LayoutDashboard, Calendar, PlusCircle, Users, Package, DollarSign, Settings, Bot, FileText, ClipboardList, BarChart, Tags, PieChart } from 'lucide-react';
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

const MainLayout = () => {
    const navigate = useNavigate();
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
                    {/* Common */}
                    <div className="px-4 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Principal</div>
                    <NavItem path="/" icon={LayoutDashboard} label="Dashboard" isActive={checkActive('/')} onClick={handleNavClick} />
                    <NavItem path="/pedidos/nuevo" icon={PlusCircle} label="Nuevo Pedido" isActive={checkActive('/pedidos/nuevo')} onClick={handleNavClick} />
                    <NavItem path="/pedidos" icon={Package} label="Pedidos" isActive={checkActive('/pedidos')} onClick={handleNavClick} />
                    <NavItem path="/calendario" icon={Calendar} label="Calendario" isActive={checkActive('/calendario')} onClick={handleNavClick} />

                    {/* Operational */}
                    <div className="px-4 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 mt-6">Operaciones</div>
                    <NavItem path="/caja" icon={DollarSign} label="Caja y Cortes" isActive={checkActive('/caja')} onClick={handleNavClick} />
                    <NavItem path="/produccion" icon={ClipboardList} label="Producción" isActive={checkActive('/produccion')} onClick={handleNavClick} />

                    {/* Admin / Owner Only */}
                    {['SUPER_ADMIN', 'ADMIN'].includes(user?.role) && (
                        <>
                            <div className="px-4 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 mt-6">Sistema</div>
                            <NavItem path="/auditoria" icon={FileText} label="Auditoría" isActive={checkActive('/auditoria')} onClick={handleNavClick} />
                            <NavItem path="/usuarios" icon={Users} label="Usuarios" isActive={checkActive('/usuarios')} onClick={handleNavClick} />

                            <div className="px-4 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 mt-6">Administración</div>
                            <NavItem path="/admin/stats" icon={BarChart} label="Reportes" isActive={checkActive('/admin/stats')} onClick={handleNavClick} />
                            <NavItem path="/admin/sabores" icon={Tags} label="Sabores y Catálogo" isActive={checkActive('/admin/sabores')} onClick={handleNavClick} />
                            {user?.role === 'SUPER_ADMIN' && ( // Only SUPER_ADMIN sees commissions
                                <NavItem path="/admin/comisiones" icon={PieChart} label="Comisiones" isActive={checkActive('/admin/comisiones')} onClick={handleNavClick} />
                            )}
                            <NavItem path="/configuracion" icon={Settings} label="Configuración" isActive={checkActive('/configuracion')} onClick={handleNavClick} />
                        </>
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
    );
};

export default MainLayout;
