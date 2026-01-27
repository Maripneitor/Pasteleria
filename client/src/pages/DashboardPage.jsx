import React from 'react';
import { motion } from 'framer-motion';
import {
  PlusCircle, Mic, Users, PieChart, DollarSign,
  Calendar, LogOut, Cake, ChefHat, Search
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useEffect, useState } from 'react';
import client from '../config/axios';
import { Printer } from 'lucide-react'; // Import Printer icon

const DashboardPage = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    // Cargar estadísticas reales al montar
    const loadStats = async () => {
      try {
        // const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
        // Nota: Si se requiere auth token, debería ir aquí o en un interceptor.
        // Asumimos que axios está configurado o el usuario arreglará auth.
        const res = await client.get('/folios/stats/dashboard');
        setStats(res.data);
      } catch (e) {
        console.error("Error cargando stats", e);
        // Fallback mock data para demo visual si falla backend
        setStats({
          populares: [
            { name: 'Chocolate', value: 45 },
            { name: 'Vainilla', value: 30 },
            { name: 'Red Velvet', value: 25 },
          ]
        });
      }
    };
    loadStats();
  }, []);

  const handleDownloadPDF = async (id) => {
    try {
      const response = await client.get(`/folios/${id}/pdf`, {
        responseType: 'blob', // Importante para manejar binarios
      });

      // Crear Blob y Link de descarga
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `folio-${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Error descargando PDF", error);
      alert('Error al descargar el PDF');
    }
  };

  // Configuración de Tarjetas de Acción Rápida
  const actions = [
    { title: 'Nuevo Folio', icon: PlusCircle, color: 'bg-pink-500', path: '/pedidos/nuevo', delay: 0.1 },
    { title: 'Dictar Pedido', icon: Mic, color: 'bg-violet-600', path: '/pedidos/dictar', delay: 0.2 },
    { title: 'Ver Calendario', icon: Calendar, color: 'bg-blue-500', path: '/calendario', delay: 0.3 },
  ];

  // Configuración de Módulos Admin
  const adminModules = [
    { title: 'Admin Usuarios', icon: Users, color: 'text-blue-600', bg: 'bg-blue-100', path: '/admin/usuarios' },
    { title: 'Sabores y Rellenos', icon: ChefHat, color: 'text-pink-600', bg: 'bg-pink-100', path: '/admin/sabores' },
    { title: 'Estadísticas', icon: PieChart, color: 'text-purple-600', bg: 'bg-purple-100', path: '/admin/stats' },
    { title: 'Rep. Comisiones', icon: DollarSign, color: 'text-green-600', bg: 'bg-green-100', path: '/admin/comisiones' },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 fade-in">

      {/* 1. Header de Bienvenida */}
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
            Pastelería <span className="text-pink-500">"La Fiesta"</span>
          </h1>
          <p className="text-gray-500 dark:text-gray-400">¡Hola! ¿Qué vamos a hornear hoy?</p>
        </div>
        <div className="flex gap-2">
          <button className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 dark:bg-gray-700">
            <Search size={20} />
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition">
            <LogOut size={18} /> Salir
          </button>
        </div>
      </header>

      {/* 2. Acciones Principales (Animadas) */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {actions.map((action, index) => (
          <motion.button
            key={index}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: action.delay }}
            onClick={() => navigate(action.path)}
            className={`${action.color} text-white p-6 rounded-2xl shadow-lg flex flex-col items-center justify-center gap-3 h-40 cursor-pointer border-none`}
          >
            <action.icon size={48} strokeWidth={1.5} />
            <span className="text-xl font-semibold">{action.title}</span>
          </motion.button>
        ))}
      </section>

      {/* 3. Panel de Administración (Grid Pequeño) */}
      <section>
        <h2 className="text-xl font-bold text-gray-700 dark:text-gray-200 mb-4 flex items-center gap-2">
          <Users size={20} /> Administración
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {adminModules.map((mod, index) => (
            <motion.div
              key={index}
              whileHover={{ y: -5 }}
              className={`${mod.bg} p-4 rounded-xl cursor-pointer shadow-sm hover:shadow-md transition-all flex flex-col items-center text-center gap-2`}
              onClick={() => navigate(mod.path)}
            >
              <div className={`p-3 rounded-full bg-white ${mod.color}`}>
                <mod.icon size={24} />
              </div>
              <span className={`font-medium ${mod.color.replace('text-', 'text-opacity-80-')}`}>{mod.title}</span>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 3.5. Gráficas de Estadísticas */}
      <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6 h-80">
        <h3 className="text-lg font-bold mb-4 text-gray-700 dark:text-gray-200">Sabores Populares</h3>
        <ResponsiveContainer width="100%" height="100%">
          <RechartsPieChart>
            <Pie
              data={stats?.populares || []}
              dataKey="value"
              nameKey="name"
              cx="50%" cy="50%"
              outerRadius={80}
              fill="#8884d8"
              label
            >
              {stats?.populares?.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={['#ec4899', '#8b5cf6', '#f59e0b', '#10b981'][index % 4]} />
              ))}
            </Pie>
            <Tooltip />
          </RechartsPieChart>
        </ResponsiveContainer>
      </section>

      {/* 4. Resumen Rápido (Tabla Mockup) */}
      <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6">
        <h3 className="text-lg font-bold mb-4">Pedidos Recientes</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-gray-400 border-b dark:border-gray-700">
                <th className="pb-2">Folio</th>
                <th className="pb-2">Cliente</th>
                <th className="pb-2">Entrega</th>
                <th className="pb-2">Estado</th>
                <th className="pb-2">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-gray-700">
              {/* Mock Data */}
              {[1, 2, 3].map(i => (
                <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="py-3 font-mono text-pink-500">#F-{202500 + i}</td>
                  <td className="py-3">María Pérez</td>
                  <td className="py-3">Hoy, 14:00 PM</td>
                  <td className="py-3"><span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs">Producción</span></td>
                  <td className="py-3">
                    <button
                      onClick={() => handleDownloadPDF(i)}
                      className="p-2 text-gray-500 hover:text-pink-500 hover:bg-pink-50 rounded-full transition"
                      title="Imprimir Folio"
                    >
                      <Printer size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default DashboardPage;
