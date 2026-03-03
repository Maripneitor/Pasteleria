import React, { useEffect, useState } from 'react';
// eslint-disable-next-line
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import client from '../config/axios';
import ordersApi from '../services/ordersApi';
import { clearToken } from '../utils/auth';
import { handlePdfResponse } from '../utils/pdfHelper';
import toast from 'react-hot-toast';
import { Search, PlusCircle, Mic, Calendar, User as UserIcon, LogOut, Users, ChefHat, PieChart, DollarSign, FileText, Printer, Store, Activity, ArrowRight } from 'lucide-react';
import { PieChart as RechartsPieChart, Pie, Cell, Tooltip } from 'recharts';
import { useAuth } from '../context/AuthContext';

import PageHeader from '../components/common/PageHeader';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../components/common/Table';
import Badge from '../components/common/Badge';
import EmptyState from '../components/common/EmptyState';

// Helper for currency
const formatMoney = (amount) => `$${Number(amount || 0).toLocaleString()}`;

const OwnerDashboard = ({ stats, navigate, handleLogout }) => {
  const valSales = stats?.metrics?.totalSales || 0;
  const valOrders = stats?.metrics?.pendingOrders || 0; // Utilizando pedidos pendientes/activos globally

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 fade-in pb-20">
      <PageHeader
        title={<span>Dashboard <span className="text-pink-600">Central</span></span>}
        subtitle="Vista global de sucursales"
        actions={<Button variant="danger" icon={LogOut} onClick={handleLogout}>Salir</Button>}
      />

      {/* Global Stats */}
      <div className="flex flex-col md:flex-row gap-6">
        <Card className="flex-1 bg-gradient-to-br from-pink-500 to-pink-600 text-white shadow-xl shadow-pink-200 border-none relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl"></div>
          <div className="flex justify-between items-center relative z-10">
            <div>
              <span className="text-pink-100 text-sm font-bold uppercase tracking-wider">Ventas Globales Hoy</span>
              <div className="text-5xl font-black mt-1 tracking-tight">{formatMoney(valSales)}</div>
            </div>
            <Activity size={48} className="text-pink-300 opacity-50" />
          </div>
        </Card>

        <Card className="flex-1 bg-gradient-to-br from-slate-800 to-slate-900 text-white shadow-xl shadow-slate-200 border-none relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white opacity-5 rounded-full blur-2xl"></div>
          <div className="flex justify-between items-center relative z-10">
            <div>
              <span className="text-slate-300 text-sm font-bold uppercase tracking-wider">Total Pedidos Activos</span>
              <div className="text-5xl font-black mt-1 tracking-tight">{valOrders}</div>
            </div>
            <PieChart size={48} className="text-slate-500 opacity-50" />
          </div>
        </Card>
      </div>

      {/* Branch Grid */}
      <div className="flex items-center gap-3 mt-10 mb-6">
        <Store className="text-pink-500" size={28} />
        <h3 className="text-2xl font-black text-gray-800 tracking-tight">Estado de Sucursales</h3>
      </div>

      {!stats?.branchStats?.length ? (
        <EmptyState title="Sin sucursales registradas" description="Añade sucursales para comenzar a ver el resumen aquí." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(stats?.branchStats || []).map(branch => (
            <Card key={branch.id} className="relative overflow-hidden group hover:shadow-xl transition-all border-none ring-1 ring-gray-100 bg-white shadow-md">
              <div className="p-1">
                {/* Branch header */}
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-pink-50 rounded-2xl group-hover:bg-pink-100 transition-colors">
                      <Store className="text-pink-600" size={24} />
                    </div>
                    <h4 className="font-extrabold text-xl text-gray-900 tracking-tight">{branch.name}</h4>
                  </div>
                </div>

                {/* Stats */}
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between items-center p-3 sm:p-4 bg-gray-50/80 rounded-2xl border border-gray-100">
                    <span className="text-sm font-bold text-gray-500">Caja de Cobro</span>
                    {branch.cajaAbierta ? (
                      <span className="flex items-center gap-2 text-sm font-black text-emerald-600 bg-emerald-100/50 px-3 py-1.5 rounded-lg border border-emerald-200">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
                        ABIERTA
                      </span>
                    ) : (
                      <span className="flex items-center gap-2 text-sm font-black text-gray-500 bg-gray-200/50 px-3 py-1.5 rounded-lg border border-gray-300">
                        <div className="w-2.5 h-2.5 rounded-full bg-gray-400"></div>
                        CERRADA
                      </span>
                    )}
                  </div>
                  <div className="flex justify-between items-center p-3 sm:p-4 bg-gray-50/80 rounded-2xl border border-gray-100">
                    <span className="text-sm font-bold text-gray-500">Ventas del Día</span>
                    <span className="font-black text-xl text-gray-900 tracking-tight">{formatMoney(branch.ventasHoy)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 sm:p-4 bg-gray-50/80 rounded-2xl border border-gray-100">
                    <span className="text-sm font-bold text-gray-500">Pedidos Activos</span>
                    <span className="font-black text-pink-600 bg-pink-100/50 px-3 py-1 rounded-lg border border-pink-200">
                      {branch.pedidosActivos} en prep.
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <Button variant="primary" fullWidth className="bg-pink-500 hover:bg-pink-600 shadow-lg shadow-pink-200 tracking-wide text-sm py-3.5" onClick={() => navigate('/pedidos')}>
                  Gestionar Sucursal <ArrowRight size={18} className="ml-2" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Quick Links for the Owner */}
      <div className="mt-10 pt-8 border-t border-gray-100 flex flex-wrap gap-4">
        <Button variant="secondary" icon={Users} onClick={() => navigate('/usuarios')} className="bg-white">Gestionar Personal</Button>
        <Button variant="secondary" icon={FileText} onClick={() => navigate('/admin/reports')} className="bg-white">Ver Reportes Financieros</Button>
      </div>
    </div>
  );
};

const EmployeeDashboard = ({ stats, navigate, handleLogout, handleBuscar, handleDownloadPDF }) => {
  const actions = [
    { title: 'Nuevo Folio', icon: PlusCircle, bg: 'bg-pink-600 border border-pink-500 shadow-md shadow-pink-200', onClick: () => navigate('/pedidos/nuevo') },
    { title: 'Dictar Pedido', icon: Mic, bg: 'bg-violet-600 border border-violet-500 shadow-md shadow-violet-200', onClick: () => window.dispatchEvent(new Event('open-ai-tray')) },
    { title: 'Ver Calendario', icon: Calendar, bg: 'bg-blue-500 border border-blue-400 shadow-md shadow-blue-200', onClick: () => navigate('/calendario') },
  ];

  const adminModules = [
    { title: 'Usuarios', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50 hover:bg-blue-100', path: '/usuarios' },
    { title: 'Sabores', icon: ChefHat, color: 'text-pink-600', bg: 'bg-pink-50 hover:bg-pink-100', path: '/admin/sabores' },
    { title: 'Reportes', icon: PieChart, color: 'text-purple-600', bg: 'bg-purple-50 hover:bg-purple-100', path: '/admin/stats' },
    { title: 'Comisiones', icon: DollarSign, color: 'text-green-600', bg: 'bg-green-50 hover:bg-green-100', path: '/admin/comisiones' },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 fade-in pb-20">
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
        <div className="lg:col-span-2 space-y-8">
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
                        <button onClick={(e) => { e.stopPropagation(); handleDownloadPDF(f.id); }} className="p-1 hover:bg-gray-100 rounded text-gray-500">
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

        <div className="space-y-8">
          <Card title="Administración">
            <div className="grid grid-cols-2 gap-3">
              {adminModules.map((mod, idx) => (
                <div key={idx} onClick={() => navigate(mod.path)} className={`${mod.bg} p-4 rounded-xl cursor-pointer hover:shadow-md transition flex flex-col items-center gap-2 text-center`}>
                  <mod.icon className={mod.color} size={24} />
                  <span className={`text-xs font-bold ${mod.color.replace('text-', 'text-opacity-80-')}`}>{mod.title}</span>
                </div>
              ))}
            </div>
          </Card>
          <Card title="Sabores Top">
            <div className="h-[200px] w-full items-center justify-center flex">
              <RechartsPieChart width={200} height={200}>
                <Pie data={stats?.populares || []} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={5}>
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

const DashboardPage = () => {
  const navigate = useNavigate();
  const { isOwnerOrAdmin } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('primary'); // 'primary' or 'hub'

  useEffect(() => {
    const loadStats = async () => {
      try {
        const res = await client.get('/folios/stats/dashboard');
        setStats(res.data);
      } catch (e) {
        setStats({
          metrics: { totalSales: 0, todayOrders: 0, pendingOrders: 0, totalOrders: 0 },
          branchStats: [],
          recientes: [],
          populares: []
        });
      } finally {
        setLoading(false);
      }
    };
    loadStats();
    const onChanged = () => loadStats();
    window.addEventListener('folios:changed', onChanged);
    return () => window.removeEventListener('folios:changed', onChanged);
  }, []);

  const handleDownloadPDF = (id) => handlePdfResponse(() => ordersApi.downloadPdf(id));
  const handleBuscar = () => {
    const q = prompt("¿Qué deseas buscar? (nombre, teléfono o folio)");
    if (q) navigate(`/pedidos?q=${encodeURIComponent(q)}`);
  };
  const handleLogout = () => {
    if (window.confirm("¿Cerrar sesión?")) {
      clearToken();
      toast.success("Sesión cerrada.");
      navigate('/login');
    }
  };

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

  const toggleView = () => {
    setViewMode(prev => prev === 'primary' ? 'hub' : 'primary');
  };

  const renderContent = () => {
    // Si no es dueño/admin, siempre ve el primario.
    // Si lo es, ve el que haya seleccionado (por defecto primario).
    if (isOwnerOrAdmin() && viewMode === 'hub') {
      return (
        <div className="space-y-4">
          <div className="flex justify-end max-w-7xl mx-auto px-6 pt-4">
            <Button variant="secondary" onClick={toggleView} className="bg-white border-pink-200 text-pink-700 hover:bg-pink-50">
              ← Volver al Dashboard Principal
            </Button>
          </div>
          <OwnerDashboard stats={stats} navigate={navigate} handleLogout={handleLogout} />
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {isOwnerOrAdmin() && (
          <div className="flex justify-end max-w-7xl mx-auto px-6 pt-4 pb-0 mb-[-1rem]">
            <Button variant="secondary" onClick={toggleView} icon={Store} className="bg-pink-50 border-pink-200 text-pink-700 hover:bg-pink-100 relative z-10 w-full md:w-auto">
              Ver Hub de Operaciones Multi-Sucursal
            </Button>
          </div>
        )}
        <EmployeeDashboard
          stats={stats}
          navigate={navigate}
          handleLogout={handleLogout}
          handleBuscar={handleBuscar}
          handleDownloadPDF={handleDownloadPDF}
        />
      </div>
    );
  }

  return renderContent();
};

export default DashboardPage;

