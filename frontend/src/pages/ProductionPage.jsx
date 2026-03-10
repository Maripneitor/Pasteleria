import React, { useState, useEffect } from 'react';
import client from '../config/axios';
import PageHeader from '../components/common/PageHeader';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import { Loader2, CheckCircle, Clock, Flame, Palette, RefreshCw, Printer, Tag, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_COLS = [
    { key: 'Pendiente', label: 'Por Hacer', icon: Clock, bg: 'bg-gray-100', text: 'text-gray-600' },
    { key: 'En Horno', label: 'Horneando', icon: Flame, bg: 'bg-orange-100/50', text: 'text-orange-600' },
    { key: 'Decoracion', label: 'Decoración', icon: Palette, bg: 'bg-purple-100/50', text: 'text-purple-600' },
    { key: 'Terminado', label: 'Listo', icon: CheckCircle, bg: 'bg-green-100/50', text: 'text-green-600' }
];

export default function ProductionPage() {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filterStatus, setFilterStatus] = useState('ALL');

    const fetchProduction = async () => {
        setLoading(true);
        try {
            const statusParam = filterStatus !== 'ALL' ? `&status=${filterStatus}` : '';
            const res = await client.get(`/production?date=${date}${statusParam}`);
            setOrders(res.data);
        } catch {
            console.error("Error descargando producción");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProduction();
        const interval = setInterval(fetchProduction, 30000);
        const onChanged = () => fetchProduction();
        window.addEventListener('folios:changed', onChanged);
        return () => {
            clearInterval(interval);
            window.removeEventListener('folios:changed', onChanged);
        };
    }, [date, filterStatus]);

    const handleStatusMove = async (orderId, newStatus) => {
        const prevOrders = [...orders];
        setOrders(orders.map(o => o.id === orderId ? { ...o, estatus_produccion: newStatus } : o));
        try {
            await client.patch(`/production/${orderId}/status`, { status: newStatus });
            toast.success("Estado actualizado");
        } catch {
            toast.error("Error moviendo tarjeta");
            setOrders(prevOrders);
        }
    };

    const handlePrintComanda = (id) => {
        window.open(`${import.meta.env.VITE_API_URL}/folios/${id}/pdf?type=comanda`, '_blank');
    };

    const handlePrintLabel = (id) => {
        window.open(`${import.meta.env.VITE_API_URL}/folios/${id}/pdf?type=label`, '_blank');
    };

    const getOrdersByStatus = (status) => {
        return orders.filter(o => {
            const s = o.estatus_produccion || 'Pendiente';
            if (status === 'Pendiente') return ['Pendiente', 'Nuevo'].includes(s);
            return s === status;
        });
    };

    return (
        <div className="p-6 max-w-7xl mx-auto h-[calc(100vh-64px)] flex flex-col space-y-4">
            <PageHeader
                title="Centro de Producción (KDS)"
                subtitle="Gestión de cocina en tiempo real"
                actions={
                    <div className="flex gap-4 items-center">
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="text-sm p-2 border border-gray-200 rounded-lg outline-none bg-white font-medium"
                        >
                            <option value="ALL">Todos los estados</option>
                            <option value="Pendiente">Pendiente</option>
                            <option value="En Horno">En Horno</option>
                            <option value="Decoracion">Decoración</option>
                            <option value="Terminado">Listo</option>
                        </select>
                        <div className="flex gap-2 items-center bg-white p-1 rounded-lg border border-gray-200 shadow-sm">
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="p-1 px-2 text-sm outline-none font-medium"
                            />
                            <Button variant="ghost" size="sm" onClick={fetchProduction} loading={loading} icon={RefreshCw} />
                        </div>
                    </div>
                }
            />

            <div className="flex-1 min-h-0 overflow-x-auto grid grid-cols-1 md:grid-cols-4 gap-4 pb-4">
                {STATUS_COLS.map(col => (
                    <div key={col.key} className={`flex flex-col rounded-xl p-3 min-w-[280px] border border-gray-200 bg-gray-50/30 shadow-inner`}>
                        <div className={`flex items-center gap-2 mb-3 p-2 rounded-lg ${col.bg} ${col.text} font-bold text-sm uppercase tracking-wide shadow-sm`}>
                            <col.icon size={16} />
                            <span>{col.label}</span>
                            <span className="ml-auto bg-white/80 px-2 rounded text-xs py-0.5 border border-black/5">
                                {getOrdersByStatus(col.key).length}
                            </span>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar px-1">
                            {getOrdersByStatus(col.key).map(order => (
                                <div key={order.id} className={`bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all group relative ${order.is_urgent ? 'ring-2 ring-red-400' : ''}`}>
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex gap-1 items-center">
                                            <Badge variant="default" className="font-mono text-[11px] py-0">#{order.folio_numero}</Badge>
                                            {order.has_allergy && <AlertTriangle size={14} className="text-red-500 animate-pulse" />}
                                        </div>
                                        <span className="text-xs font-bold text-gray-800 flex items-center gap-1 bg-gray-100 px-1.5 py-0.5 rounded-full border border-gray-200">
                                            <Clock size={10} /> {order.hora_entrega}
                                        </span>
                                    </div>

                                    <h4 className="font-bold text-gray-900 line-clamp-1 text-sm">{order.cliente_nombre}</h4>

                                    <div className="mt-2 space-y-1">
                                        {order.sabores_pan && (
                                            <div className="text-[10px] text-orange-700 bg-orange-50 px-1.5 py-0.5 rounded inline-block mr-1 font-semibold uppercase">
                                                {typeof order.sabores_pan === 'string' ? JSON.parse(order.sabores_pan).join(', ') : order.sabores_pan.join(', ')}
                                            </div>
                                        )}
                                        {order.rellenos && (
                                            <div className="text-[10px] text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded inline-block font-semibold uppercase">
                                                {typeof order.rellenos === 'string' ? JSON.parse(order.rellenos).join(', ') : order.rellenos.join(', ')}
                                            </div>
                                        )}
                                    </div>

                                    <p className="text-xs text-gray-600 line-clamp-3 mt-2 font-medium bg-gray-50 p-2 rounded-lg border border-gray-100 italic">
                                        {order.descripcion_diseno || 'N/A'}
                                    </p>

                                    {/* Action Box */}
                                    <div className="mt-4 flex gap-2 items-center justify-between border-t border-gray-50 pt-3">
                                        <div className="flex gap-1">
                                            <button onClick={() => handlePrintComanda(order.id)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500" title="Comanda">
                                                <Printer size={16} />
                                            </button>
                                            <button onClick={() => handlePrintLabel(order.id)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500" title="Etiqueta">
                                                <Tag size={16} />
                                            </button>
                                        </div>

                                        <div className="flex gap-1">
                                            {col.key !== 'Pendiente' && (
                                                <button
                                                    onClick={() => handleStatusMove(order.id, STATUS_COLS[STATUS_COLS.indexOf(col) - 1].key)}
                                                    className="p-1 px-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded bg-white border border-gray-100"
                                                >
                                                    &larr;
                                                </button>
                                            )}
                                            {col.key !== 'Terminado' && (
                                                <button
                                                    onClick={() => handleStatusMove(order.id, STATUS_COLS[STATUS_COLS.indexOf(col) + 1].key)}
                                                    className="p-1 px-3 text-white bg-pink-500 hover:bg-pink-600 rounded-lg shadow-sm font-bold text-sm"
                                                >
                                                    LISTO &rarr;
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
