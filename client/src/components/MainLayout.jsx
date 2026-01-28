import React, { useState } from 'react';
import { Menu, X, Home, FilePlus, Calendar, Settings, LogOut, Users, LayoutDashboard, PlusCircle, Bot } from 'lucide-react';
import { useNavigate, useLocation, Link, Outlet } from 'react-router-dom';
import toast from 'react-hot-toast';

const MainLayout = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    const handleLogout = () => {
        localStorage.removeItem('token');
        toast.success('Sesión cerrada');
        window.location.href = '/login';
    };

    const isActive = (path) => location.pathname === path
        ? "bg-pink-100 text-pink-700 font-bold shadow-sm"
        : "text-gray-500 hover:bg-gray-50 hover:text-gray-900";

    return (
        <div className="flex h-screen bg-gray-50 font-sans">
            {/* 🟢 SIDEBAR (Barra Lateral) */}
            <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 flex flex-col transition-transform duration-300 ease-in-out md:translate-x-0 md:static
        ${isMobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
      `}>
                <div className="p-6">
                    <h1 className="text-3xl font-extrabold text-pink-600 tracking-tight flex items-center gap-2">
                        🧁 La Fiesta
                    </h1>
                </div>

                <nav className="flex-1 px-4 space-y-2">
                    <Link to="/" className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive('/')}`}>
                        <LayoutDashboard size={20} /> Dashboard
                    </Link>
                    <Link to="/calendario" className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive('/calendario')}`}>
                        <Calendar size={20} /> Calendario
                    </Link>
                    <Link to="/pedidos/nuevo" className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive('/pedidos/nuevo')}`}>
                        <PlusCircle size={20} /> Nuevo Pedido
                    </Link>
                    <Link to="/admin/usuarios" className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive('/admin/usuarios')}`}>
                        <Users size={20} /> Usuarios
                    </Link>
                </nav>

                <div className="p-4 border-t border-gray-100">
                    <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 w-full text-left text-red-500 hover:bg-red-50 rounded-xl transition font-medium">
                        <LogOut size={20} /> Salir
                    </button>
                </div>
            </aside>

            {/* Overlay Mobile */}
            {isMobileOpen && (
                <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={() => setIsMobileOpen(false)} />
            )}

            {/* 🔵 CONTENIDO PRINCIPAL */}
            <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
                {/* Mobile Header Button */}
                <div className="md:hidden p-4 bg-white border-b flex justify-between items-center">
                    <h1 className="text-xl font-bold text-pink-600">La Fiesta</h1>
                    <button onClick={() => setIsMobileOpen(true)} className="p-2 text-gray-600">
                        <Menu />
                    </button>
                </div>

                {/* Header Desktop */}
                <header className="hidden md:flex bg-white/90 backdrop-blur-md border-b h-16 items-center justify-between px-8 z-20 shadow-sm">
                    <h2 className="font-bold text-gray-700 text-lg">Panel de Control</h2>
                    <div className="flex items-center gap-4">
                        <button className="p-2 bg-purple-100 text-purple-600 rounded-full hover:bg-purple-200 transition">
                            <Bot size={20} />
                        </button>
                        <div className="w-8 h-8 bg-pink-500 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md">
                            A
                        </div>
                    </div>
                </header>

                {/* 👇 AQUÍ ESTÁ LA CLAVE: El Outlet renderiza las páginas hijas */}
                <main className="flex-1 overflow-auto p-6 bg-gray-50">
                    <div className="max-w-7xl mx-auto h-full">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default MainLayout;
