import React, { useState, useEffect } from 'react';
import client from '../config/axios';
import PageHeader from '../components/common/PageHeader';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import { Loader2, CheckCircle, Clock, Flame, Palette, RefreshCw } from 'lucide-react';
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

    const fetchProduction = async () => {
        setLoading(true);
        try {
            const res = await client.get(`/production?date=${date}`);
            setOrders(res.data);
        } catch (e) {
            console.error(e);
            toast.error("Error descargando producción");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProduction();
        // Polling simple cada 30s
        const interval = setInterval(fetchProduction, 30000);

        // Listener de actualización global
        const onChanged = () => fetchProduction();
        window.addEventListener('folios:changed', onChanged);

        return () => {
            clearInterval(interval);
            window.removeEventListener('folios:changed', onChanged);
        };
    }, [date]);

    const handleStatusMove = async (orderId, newStatus) => {
        // Optimistic update
        const prevOrders = [...orders];
        setOrders(orders.map(o => o.id === orderId ? { ...o, estatus_produccion: newStatus } : o));

        try {
            await client.patch(`/production/${orderId}/status`, { status: newStatus });
            toast.success("Estado actualizado");
        } catch (e) {
            toast.error("Error moviendo tarjeta");
            setOrders(prevOrders); // Revert
        }
    };

    const getOrdersByStatus = (status) => {
        return orders.filter(o => {
            const s = o.estatus_produccion || 'Pendiente';
            if (status === 'Pendiente') return ['Pendiente', 'Nuevo'].includes(s);
            return s === status;
        });
    };

    return (
        <div className="p-6 max-w-7xl mx-auto h-[calc(100vh-64px)] flex flex-col">
            <PageHeader
                title="Producción & Cocina"
                subtitle="Tablero Kanban de órdenes diarias."
                actions={
                    <div className="flex gap-2 items-center bg-white p-1 rounded-lg border border-gray-200">
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="p-1 px-2 text-sm outline-none"
                        />
                        <Button variant="ghost" size="sm" onClick={fetchProduction} loading={loading} icon={RefreshCw} />
                    </div>
                }
            />

            <div className="flex-1 min-h-0 overflow-x-auto grid grid-cols-1 md:grid-cols-4 gap-4 pb-4">
                {STATUS_COLS.map(col => (
                    <div key={col.key} className={`flex flex-col rounded-xl p-3 min-w-[280px] border border-gray-200/50 bg-gray-50/50`}>
                        <div className={`flex items-center gap-2 mb-3 p-2 rounded-lg ${col.bg} ${col.text} font-bold text-sm uppercase tracking-wide`}>
                            <col.icon size={16} />
                            <span>{col.label}</span>
                            <span className="ml-auto bg-white/80 px-2 rounded text-xs py-0.5">
                                {getOrdersByStatus(col.key).length}
                            </span>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar px-1">
                            {getOrdersByStatus(col.key).map(order => (
                                <div key={order.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all group relative">
                                    <div className="flex justify-between items-start mb-2">
                                        <Badge variant="default" className="font-mono text-[10px]">#{order.folio_numero}</Badge>
                                        <span className="text-xs font-bold text-gray-800 flex items-center gap-1 bg-gray-100 px-1.5 py-0.5 rounded">
                                            <Clock size={10} /> {order.hora_entrega}
                                        </span>
                                    </div>
                                    <h4 className="font-bold text-gray-900 line-clamp-2 text-sm mb-1">{order.cliente_nombre}</h4>
                                    <p className="text-xs text-gray-500 line-clamp-2">
                                        {/* Detalle */}
                                        {order.sabores_pan?.length ? order.sabores_pan.join(', ') : order.descripcion_diseno || 'Sin descripción'}
                                    </p>

                                    {/* Action Buttons Overlay or Helper */}
                                    <div className="mt-3 flex gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                        {col.key !== 'Pendiente' && (
                                            <button
                                                onClick={() => handleStatusMove(order.id, STATUS_COLS[STATUS_COLS.indexOf(col) - 1].key)}
                                                className="p-1.5 bg-gray-100 hover:bg-gray-200 rounded text-gray-600"
                                                title="Mover Atrás"
                                            >
                                                &larr;
                                            </button>
                                        )}
                                        {col.key !== 'Terminado' && (
                                            <button
                                                onClick={() => handleStatusMove(order.id, STATUS_COLS[STATUS_COLS.indexOf(col) + 1].key)}
                                                className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded"
                                                title="Avanzar"
                                            >
                                                &rarr;
                                            </button>
                                        )}
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
