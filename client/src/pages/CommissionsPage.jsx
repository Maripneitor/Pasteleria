import { useState, useEffect, useCallback } from 'react';
import commissionsApi from '../services/commissionsApi';
import { toast } from 'react-hot-toast';
import { Mail, RefreshCw } from 'lucide-react';



const CommissionsPage = () => {
    // State
    const [loading, setLoading] = useState(false);
    const [report, setReport] = useState(null);

    // Dates (Defaults to current month)
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];


    const [sendingEmail, setSendingEmail] = useState(false);

    const handleSendEmail = async () => {
        if (!window.confirm("¿Enviar reporte por correo a los administradores?")) return;

        setSendingEmail(true);
        try {
            await commissionsApi.sendReportEmail(filters.from, filters.to);
            toast.success("Correo enviado exitosamente");
        } catch (e) {
            console.error(e);
            toast.error("Error enviando correo");
        } finally {
            setSendingEmail(false);
        }
    };

    const [filters, setFilters] = useState({
        from: firstDay,
        to: lastDay
    });

    const fetchReport = useCallback(async () => {
        setLoading(true);
        try {
            const data = await commissionsApi.getReport(filters.from, filters.to);
            setReport(data);
        } catch (error) {
            console.error(error);
            toast.error('Error cargando reporte de comisiones');
        } finally {
            setLoading(false);
        }
    }, [filters.from, filters.to]);

    useEffect(() => {
        fetchReport();
    }, [fetchReport]);

    const handleDateChange = (e) => {
        setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    // Calculate totals from report data safely
    const totalCommissions = report?.totalCommission || 0;
    const appliedCommissions = report?.totalApplied || 0;
    const pendingCommissions = totalCommissions - appliedCommissions;

    // Helper for currency
    const formatMoney = (amount) => {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN'
        }).format(amount || 0);
    };

    return (
        <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Comisiones por Ventas</h1>
                    <p className="text-gray-500 text-sm">Reporte de comisiones generadas por cajeros/vendedores.</p>
                </div>

                <div className="flex flex-wrap gap-2 items-end">
                    <div className="flex flex-col">
                        <label className="text-xs text-gray-400">Desde</label>
                        <input
                            type="date"
                            name="from"
                            value={filters.from}
                            onChange={handleDateChange}
                            className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-pink-500 outline-none"
                        />
                    </div>
                    <div className="flex flex-col">
                        <label className="text-xs text-gray-400">Hasta</label>
                        <input
                            type="date"
                            name="to"
                            value={filters.to}
                            onChange={handleDateChange}
                            className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-pink-500 outline-none"
                        />
                    </div>
                    <button
                        onClick={fetchReport}
                        className="bg-white p-2.5 rounded-lg border hover:bg-gray-50 text-gray-600 transition-colors"
                        title="Recargar"
                    >
                        <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
                    </button>
                    <button
                        onClick={handleSendEmail}
                        disabled={sendingEmail}
                        className="bg-white text-gray-700 border px-4 py-2.5 rounded-lg flex items-center gap-2 hover:bg-gray-50 transition-colors shadow-sm font-medium disabled:opacity-50"
                    >
                        <Mail size={18} />
                        <span>{sendingEmail ? 'Enviando...' : 'Enviar por Correo'}</span>
                    </button>
                    <button className="bg-pink-600 text-white px-4 py-2.5 rounded-lg flex items-center gap-2 hover:bg-pink-700 transition-colors shadow-sm font-medium">
                        <Download size={18} />
                        <span>Exportar PDF</span>
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="p-3 bg-pink-100 text-pink-600 rounded-xl">
                        <DollarSign size={28} />
                    </div>
                    <div>
                        <p className="text-sm text-gray-400 font-medium">Comisiones Totales</p>
                        <h3 className="text-2xl font-bold text-gray-800">
                            {loading ? <span className="animate-pulse bg-gray-200 h-8 w-24 block rounded" /> : formatMoney(totalCommissions)}
                        </h3>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="p-3 bg-green-100 text-green-600 rounded-xl">
                        <CheckCircle size={28} />
                    </div>
                    <div>
                        <p className="text-sm text-gray-400 font-medium">Aplicadas al Cliente</p>
                        <h3 className="text-2xl font-bold text-gray-800">
                            {loading ? <span className="animate-pulse bg-gray-200 h-8 w-24 block rounded" /> : formatMoney(appliedCommissions)}
                        </h3>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="p-3 bg-orange-100 text-orange-600 rounded-xl">
                        <Clock size={28} />
                    </div>
                    <div>
                        <p className="text-sm text-gray-400 font-medium">Pendientes (Est.)</p>
                        <h3 className="text-2xl font-bold text-gray-800">
                            {loading ? <span className="animate-pulse bg-gray-200 h-8 w-24 block rounded" /> : formatMoney(pendingCommissions)}
                        </h3>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                    <h3 className="font-semibold text-gray-700">Detalle de Comisiones</h3>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="text-xs font-semibold text-gray-500 uppercase bg-gray-50 border-b">
                                <th className="px-6 py-4">Fecha</th>
                                <th className="px-6 py-4">Folio</th>
                                <th className="px-6 py-4">Cajero/User</th>
                                <th className="px-6 py-4 text-right">Monto Venta</th>
                                <th className="px-6 py-4 text-right">Comisión Calc.</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                // Skeleton Rows
                                [...Array(5)].map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-24"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-16"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-32"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-20 ml-auto"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-20 ml-auto"></div></td>
                                    </tr>
                                ))
                            ) : report?.details?.length > 0 ? (
                                report.details.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {new Date(item.date).toLocaleDateString()}
                                            <div className="text-xs text-gray-400">{new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-medium text-gray-900">#{item.folio}</td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 text-xs font-bold">
                                                    {(item.user || "U").charAt(0).toUpperCase()}
                                                </div>
                                                {item.user || "Desconocido"}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600 text-right">{formatMoney(item.saleAmount)}</td>
                                        <td className="px-6 py-4 text-sm font-bold text-green-600 text-right">{formatMoney(item.commissionAmount)}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-gray-400">
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-400">
                                                <DollarSign size={24} />
                                            </div>
                                            <p>No hay comisiones registradas en este periodo.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {!loading && report?.details?.length > 0 && (
                    <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
                        <div className="text-right">
                            <span className="text-sm text-gray-500 mr-4">Total Resultados: {report.details.length}</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CommissionsPage;
