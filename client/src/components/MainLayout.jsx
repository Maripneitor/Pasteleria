import React, { useState } from 'react';
import { Menu, X, Home, FilePlus, Calendar, Settings, LogOut, Users } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const SidebarItem = ({ icon: Icon, label, path, active, onClick }) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${active
            ? 'bg-pink-500 text-white shadow-lg shadow-pink-500/30'
            : 'text-gray-500 hover:bg-white hover:text-pink-600'
            }`}
    >
        <Icon size={20} />
        <span className="font-medium">{label}</span>
    </button>
);

const MainLayout = ({ children }) => {
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    const menuItems = [
        { icon: Home, label: 'Dashboard', path: '/' },
        { icon: FilePlus, label: 'Nuevo Pedido', path: '/pedidos/nuevo' },
        { icon: Calendar, label: 'Calendario', path: '/calendario' },
        { icon: Users, label: 'Usuarios (Admin)', path: '/admin/usuarios' },
        { icon: Settings, label: 'Configuración', path: '/admin' },
    ];

    return (
        <div className="min-h-screen flex bg-gray-50">

            {/* Botón Hamburguesa (Solo Móvil) */}
            <div className="fixed top-4 left-4 z-50 md:hidden">
                <button
                    onClick={() => setIsMobileOpen(!isMobileOpen)}
                    className="p-2 bg-white rounded-lg shadow-md text-gray-700"
                >
                    {isMobileOpen ? <X /> : <Menu />}
                </button>
            </div>

            {/* Sidebar */}
            <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-gray-50 border-r border-gray-200 transform transition-transform duration-300 ease-in-out md:translate-x-0
        ${isMobileOpen ? 'translate-x-0 shadow-2xl bg-white' : '-translate-x-full'}
      `}>
                <div className="p-6">
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        🎂 La Fiesta
                    </h2>
                </div>

                <nav className="px-4 space-y-2">
                    {menuItems.map((item) => (
                        <SidebarItem
                            key={item.path}
                            {...item}
                            active={location.pathname === item.path}
                            onClick={() => {
                                navigate(item.path);
                                setIsMobileOpen(false);
                            }}
                        />
                    ))}
                </nav>

                <div className="absolute bottom-6 left-0 w-full px-4">
                    <SidebarItem icon={LogOut} label="Cerrar Sesión" onClick={() => alert("Logout logic here")} />
                </div>
            </aside>

            {/* Overlay para cerrar menú en móvil */}
            {isMobileOpen && (
                <div
                    className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 md:hidden"
                    onClick={() => setIsMobileOpen(false)}
                />
            )}

            {/* Contenido Principal */}
            <main className="flex-1 md:ml-64 p-4 md:p-8 transition-all">
                {children}
            </main>
        </div>
    );
};

export default MainLayout;
