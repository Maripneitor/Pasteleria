import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import client from '../config/axios';
import ordersApi from '../services/ordersApi';
import { clearToken } from '../utils/auth';
import toast from 'react-hot-toast';
import {
  PlusCircle, Mic, Users, PieChart, DollarSign,
  Calendar, LogOut, Cake, ChefHat, Search, Printer,
  ArrowRight, Activity, Mail
} from 'lucide-react';
import { PieChart as RechartsPieChart, Pie, Cell, Tooltip } from 'recharts';

import PageHeader from '../components/common/PageHeader';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../components/common/Table';
import Badge from '../components/common/Badge';
import EmptyState from '../components/common/EmptyState';

// Helper for currency
const formatMoney = (amount) => `$${Number(amount || 0).toLocaleString()}`;

const DashboardPage = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [sendingCut, setSendingCut] = useState(false);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const res = await client.get('/folios/stats/dashboard');
        setStats(res.data);
      } catch (e) {
        console.error("Error loading stats", e);
        toast.error("No pudimos conectar con el servidor. Intenta de nuevo.");
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

  const handleDownloadPDF = async (id) => {
    try {
      const res = await ordersApi.downloadPdf(id);
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      window.open(url, '_blank');
    } catch (e) {
      console.error(e);
      toast.error('Error descargando PDF');
    }
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

  const handleEnviarCorte = async () => {
    if (!window.confirm("¿Enviar corte del día por correo a la administración?")) return;

    setSendingCut(true);
    try {
      const date = new Date().toISOString().split('T')[0];
      await client.post('/reports/daily-cut', { date, includeLabels: true });
      toast.success("Corte enviado correctamente. 📧");
    } catch (e) {
      console.error(e);
      toast.error("Error al enviar el corte.");
    } finally {
      setSendingCut(false);
    }
  };

  const actions = [
    { title: 'Nuevo Folio', icon: PlusCircle, bg: 'bg-pink-600', onClick: () => navigate('/pedidos/nuevo') },
    { title: 'Dictar Pedido', icon: Mic, bg: 'bg-violet-600', onClick: () => window.dispatchEvent(new Event('open-ai-tray')) },
    { title: 'Ver Calendario', icon: Calendar, bg: 'bg-blue-500', onClick: () => navigate('/calendario') },
    { title: 'Enviar Corte', icon: Mail, bg: 'bg-emerald-600', onClick: handleEnviarCorte, label: sendingCut ? 'Enviando...' : 'Enviar Corte' },
  ];

  const adminModules = [
    { title: 'Usuarios', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50', path: '/usuarios' },
    { title: 'Sabores', icon: ChefHat, color: 'text-pink-600', bg: 'bg-pink-50', path: '/admin/sabores' },
    { title: 'Reportes', icon: PieChart, color: 'text-purple-600', bg: 'bg-purple-50', path: '/admin/stats' },
    { title: 'Comisiones', icon: DollarSign, color: 'text-green-600', bg: 'bg-green-50', path: '/admin/comisiones' },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 fade-in pb-20">

      {/* 1. Header */}
      <PageHeader
        title={<span>Pastelería <span className="text-pink-600">"La Fiesta"</span></span>}
        subtitle="Panel de Control General"
        actions={
          <div className="flex gap-2">
            <Button variant="secondary" icon={Search} onClick={handleBuscar} className="hidden md:flex">Buscar</Button>
            <Button variant="danger" icon={LogOut} onClick={handleLogout}>Salir</Button>
          </div>
        }
      />

      {/* 2. KPI Cards */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="flex flex-col gap-1 border-l-4 border-l-pink-500">
          <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">Ventas Totales</span>
          <span className="text-2xl font-bold text-gray-900">{formatMoney(stats?.metrics?.totalSales)}</span>
        </Card>
        <Card className="flex flex-col gap-1 border-l-4 border-l-purple-500">
          <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">Pedidos Hoy</span>
          <span className="text-2xl font-bold text-gray-900">{stats?.metrics?.todayOrders || 0}</span>
        </Card>
        <Card className="flex flex-col gap-1 border-l-4 border-l-yellow-500">
          <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">Pendientes</span>
          <span className="text-2xl font-bold text-gray-900">{stats?.metrics?.pendingOrders || 0}</span>
        </Card>
        <Card className="flex flex-col gap-1 border-l-4 border-l-blue-500">
          <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">Histórico</span>
          <span className="text-2xl font-bold text-gray-900">{stats?.metrics?.totalOrders || 0}</span>
        </Card>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT COLUMN: Actions & Recents */}
        <div className="lg:col-span-2 space-y-8">

          {/* Quick Actions */}
          <section className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            {actions.map((action, idx) => (
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} key={idx}>
                <div
                  onClick={action.onClick}
                  className={`${action.bg} text-white p-6 rounded-2xl shadow-lg cursor-pointer flex flex-col items-center justify-center gap-3 h-32 hover:opacity-90 transition`}
                >
                  <action.icon size={32} />
                  <span className="font-bold text-sm text-center">{action.label || action.title}</span>
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
      </div>
    </div>
  );
};

export default DashboardPage;
