import React, { useEffect, useState } from 'react';
// eslint-disable-next-line
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import ExpenseForm from '@/features/cash/components/ExpenseForm';
import client from '@/config/axios';
import foliosApi from '@/features/folios/api/folios.api';
import { clearToken } from '@/utils/auth';
import { handlePdfResponse } from '@/utils/pdfHelper';
import toast from 'react-hot-toast';
import { Search, PlusCircle, Mic, Calendar, User as UserIcon, LogOut, Users, ChefHat, PieChart, DollarSign, FileText, Printer } from 'lucide-react';
import { PieChart as RechartsPieChart, Pie, Cell, Tooltip } from 'recharts';

import PageHeader from '@/components/common/PageHeader';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/common/Table';
import Badge from '@/components/common/Badge';
import EmptyState from '@/components/common/EmptyState';

// 🔐 IMPORTAMOS EL CONTEXTO DE AUTENTICACIÓN
import { useAuth } from '@/context/AuthContext';

// Helper for currency
const formatMoney = (amount) => `$${Number(amount || 0).toLocaleString()}`;

const DashboardPage = () => {
  const navigate = useNavigate();
  // 👑 SACAMOS AL USUARIO DEL CONTEXTO
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // 💡 Variable de ayuda para no repetir código
  const isAdminOrOwner = ['SUPER_ADMIN', 'OWNER'].includes(user?.role);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const res = await client.get('/folios/stats/dashboard');
        setStats(res.data);
      } catch (e) {
        console.warn("⚠️ Servidor en mantenimiento de datos o error de conexión. Usando valores por defecto.");
        // Set safe default values to prevent UI crash
        setStats({
          metrics: { totalSales: 0, todayOrders: 0, pendingOrders: 0, totalOrders: 0 },
          recientes: [],
          populares: []
        });
      } finally {
        setLoading(false);
      }
    };

    loadStats();

    // 🔥 cuando cambien folios, refrescar dashboard
    const onChanged = () => loadStats();
    window.addEventListener('folios:changed', onChanged);

    return () => window.removeEventListener('folios:changed', onChanged);
  }, []);

  const handleDownloadPDF = (id) => {
    handlePdfResponse(() => foliosApi.downloadPdf(id));
  };

  const handleBuscar = () => {
    const q = prompt("¿Qué deseas buscar? (nombre, teléfono o folio)");
    if (q) {
      navigate(`/pedidos?q=${encodeURIComponent(q)}`);
    }
  };

  const handleLogout = () => {
    if (window.confirm("¿Cerrar sesión?")) {
      clearToken();
      toast.success("Sesión cerrada. ¡Buen trabajo hoy!");
      navigate('/login');
    }
  };

  // 🔥 Filtramos las acciones rápidas (Ocultar Reportes a Empleados)
  const actions = [
    { title: 'Nuevo Folio', icon: PlusCircle, bg: 'bg-pink-600', onClick: () => navigate('/pedidos/nuevo') },
    { title: 'Dictar Pedido', icon: Mic, bg: 'bg-violet-600', onClick: () => window.dispatchEvent(new Event('open-ai-tray')) },
    { title: 'Ver Calendario', icon: Calendar, bg: 'bg-blue-500', onClick: () => navigate('/calendario') },
    ...(isAdminOrOwner ? [{ title: 'Reportes y Cortes', icon: FileText, bg: 'bg-emerald-600', onClick: () => navigate('/admin/reports') }] : []),
  ];

  // 🔥 Filtramos los módulos de administración según el rol exacto
  const adminModules = [
    // ⛔ Usuarios: Solo SUPER_ADMIN
    ...(user?.role === 'SUPER_ADMIN' ? [{ title: 'Usuarios', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50', path: '/usuarios' }] : []),
    
    // ✅ Sabores: SUPER_ADMIN y OWNER
    { title: 'Sabores', icon: ChefHat, color: 'text-pink-600', bg: 'bg-pink-50', path: '/admin/sabores' },
    
    // ✅ Reportes: SUPER_ADMIN y OWNER
    { title: 'Reportes', icon: PieChart, color: 'text-purple-600', bg: 'bg-purple-50', path: '/admin/stats' },
    
    // ⛔ Comisiones: Solo SUPER_ADMIN
    ...(user?.role === 'SUPER_ADMIN' ? [{ title: 'Comisiones', icon: DollarSign, color: 'text-green-600', bg: 'bg-green-50', path: '/admin/comisiones' }] : []),
  ];

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-400 font-medium animate-pulse">Cargando tablero...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 fade-in pb-20">

      {/* 1. Header */}
      <PageHeader
        title={<span>Pastelería <span className="text-pink-600">"La Fiesta"</span></span>}
        subtitle="Panel de Control General"
        actions={
          <div className="flex gap-2">
            <Button variant="secondary" icon={Search} onClick={handleBuscar} className="hidden md:flex">Buscar</Button>
          </div>
        }
      />

      {/* 2. KPI Cards */}
      {/* 🛠️ Ajuste de columnas si se oculta una tarjeta */}
      <section className={`grid gap-4 ${isAdminOrOwner ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-1 md:grid-cols-3'}`}>
        
        {/* 💰 Tarjeta Ventas Totales: SOLO ADMIN Y OWNER */}
        {isAdminOrOwner && (
            <Card className="flex flex-col gap-1 border-l-4 border-l-pink-500">
            <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">Ventas Totales</span>
            <span className="text-xl font-bold text-gray-900">{formatMoney(stats?.metrics?.totalSales)}</span>
            </Card>
        )}

        <Card className="flex flex-col gap-1 border-l-4 border-l-purple-500">
          <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">Pedidos Hoy</span>
          <span className="text-xl font-bold text-gray-900">{stats?.metrics?.todayOrders || 0}</span>
        </Card>
        <Card className="flex flex-col gap-1 border-l-4 border-l-yellow-500">
          <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">Pendientes</span>
          <span className="text-xl font-bold text-gray-900">{stats?.metrics?.pendingOrders || 0}</span>
        </Card>
        <Card className="flex flex-col gap-1 border-l-4 border-l-blue-500">
          <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">Histórico</span>
          <span className="text-xl font-bold text-gray-900">{stats?.metrics?.totalOrders || 0}</span>
        </Card>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT COLUMN: Actions & Recents */}
        {/* 🛠️ Si no es Admin/Owner, expande esta columna para ocupar todo el ancho */}
        <div className={`space-y-8 ${isAdminOrOwner ? 'lg:col-span-2' : 'lg:col-span-3'}`}>

          {/* Quick Actions */}
          {/* 🛠️ Ajuste de las tarjetas rápidas según cantidad */}
          <section className={`grid gap-3 md:gap-4 ${isAdminOrOwner ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-1 md:grid-cols-3'}`}>
            {actions.map((action, idx) => (
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} key={idx}>
                <div
                  onClick={action.onClick}
                  className={`${action.bg} text-white p-3 md:p-6 rounded-2xl shadow-lg cursor-pointer flex flex-col items-center justify-center gap-2 md:gap-3 h-24 md:h-32 hover:opacity-90 transition`}
                >
                  <action.icon className="w-6 h-6 md:w-8 md:h-8" />
                  <span className="font-bold text-xs md:text-sm text-center">{action.label || action.title}</span>
                </div>
              </motion.div>
            ))}
          </section>

          {/* Recents Table */}
          <Card title="Pedidos Recientes" action={<Button variant="ghost" size="sm" onClick={() => navigate('/pedidos')}>Ver Todos &rarr;</Button>}>
            {!stats?.recientes?.length ? (
              <EmptyState title="Sin pedidos recientes" description="Empieza creando un nuevo folio." />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Folio</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Entrega</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.recientes.map(f => (
                    <TableRow key={f.id} onClick={() => navigate(`/pedidos/${f.id}/editar`)} className="cursor-pointer">
                      <TableCell className="font-mono font-bold text-pink-600">{f.folio_numero}</TableCell>
                      <TableCell>{f.cliente_nombre}</TableCell>
                      <TableCell>{f.fecha_entrega} <span className="text-gray-400 text-xs">{f.hora_entrega}</span></TableCell>
                      <TableCell>
                        <Badge variant={f.estatus_folio === 'Cancelado' ? 'danger' : f.estatus_produccion === 'Terminado' ? 'success' : 'warning'}>
                          {f.estatus_folio === 'Cancelado' ? 'Cancelado' : f.estatus_produccion}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDownloadPDF(f.id); }}
                          className="p-1 hover:bg-gray-100 rounded text-gray-500"
                          title="Descargar PDF"
                        >
                          <Printer size={16} />
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>
        </div>

        {/* RIGHT COLUMN: Admin & Chats */}
        {/* ⛔ BLOQUE OCULTO PARA EL EMPLEADO COMPLETO */}
        {isAdminOrOwner && (
            <div className="space-y-8">
            {/* Admin Grid */}
            <Card title="Administración">
                <div className="grid grid-cols-2 gap-3">
                {adminModules.map((mod, idx) => (
                    <div
                    key={idx}
                    onClick={() => navigate(mod.path)}
                    className={`${mod.bg} p-4 rounded-xl cursor-pointer hover:shadow-md transition flex flex-col items-center gap-2 text-center`}
                    >
                    <mod.icon className={mod.color} size={24} />
                    <span className={`text-xs font-bold ${mod.color.replace('text-', 'text-opacity-80-')}`}>{mod.title}</span>
                    </div>
                ))}
                </div>
            </Card>

            {/* Popular Chart */}
            <Card title="Sabores Top">
                <div className="h-[200px] w-full items-center justify-center flex">
                <RechartsPieChart width={200} height={200}>
                    <Pie
                    data={stats?.populares || []}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={5}
                    >
                    {(stats?.populares || []).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={["#ec4899", "#8b5cf6", "#f59e0b", "#10b981"][index % 4]} />
                    ))}
                    </Pie>
                    <Tooltip />
                </RechartsPieChart>
                </div>
                <div className="text-center text-xs text-gray-400 mt-2">Basado en últimos pedidos</div>
            </Card>
            </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;