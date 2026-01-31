import { useState } from 'react';
import { FileText, Edit, Trash2, XCircle, DollarSign, Package } from 'lucide-react';
import client from '../config/axios';
import { ordersApi } from '../services/ordersApi';
import toast from 'react-hot-toast';

const OrderCard = ({ order, onUpdate }) => {
    const [imageLoaded, setImageLoaded] = useState(false);
    const [loading, setLoading] = useState(false);
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
    const baseUrl = apiUrl.replace(/\/api\/?$/, '');

    const imageUrl = order.imagen_referencia_url
        ? `${baseUrl}${order.imagen_referencia_url.startsWith('/') ? '' : '/'}${order.imagen_referencia_url}`
        : null;

    const handlePrintPdf = async () => {
        try {
            setLoading(true);
            const res = await ordersApi.downloadPdf(order.id);
            const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
            window.open(url, '_blank');
        } catch (e) {
            console.error(e);
            toast.error('Error al descargar PDF');
        } finally {
            setLoading(false);
        }
    };

    const handlePrintLabel = async () => {
        try {
            setLoading(true);
            const res = await ordersApi.downloadLabel(order.id);
            const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
            window.open(url, '_blank');
        } catch (e) {
            console.error(e);
            toast.error('Error al descargar Etiqueta');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (newStatus) => {
        setLoading(true);
        try {
            // To support "Mark Paid", we check if the new status is logic-based or simple field
            // Assuming endpoint accepts { status: '...' } for production
            // For Payment, we might need a dedicated endpoint or flexible PATCH

            if (newStatus === 'Pagado') {
                // For now, assume backend logic handles payment status logic via generic update or quick patch
                // But wait, listFolios returns 'estatus_pago'. 
                // We'll try generic update or assume specific quick action endpoint later. 
                // Let's use ordersApi.update for now as a safe fallback or ordersApi.status if supported.
                // The 'ordersApi.status' maps to PATCH /:id/status which updates 'estatus_produccion' usually.
                // We need to clarify if there is a payment update endpoint. 
                // server/controllers/folioController.js has updateFolioStatus -> estatus_produccion
                // server/routes/folioRoutes.js has updateFolio -> full update

                // If making 'Pagado', we update estatus_pago
                await client.put(`/folios/${order.id}`, { estatus_pago: 'Pagado' });
                toast.success('Marcado como Pagado');
            } else {
                // Update production status
                await client.patch(`/folios/${order.id}/status`, { status: newStatus });
                toast.success(`Estado actualizado a ${newStatus}`);
            }

            if (onUpdate) onUpdate();
        } catch (error) {
            console.error(error);
            toast.error('Error al actualizar');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = async () => {
        if (!confirm('¿Estás seguro de cancelar este pedido?')) return;
        setLoading(true);
        try {
            await client.patch(`/folios/${order.id}/cancel`, { motivo: 'Cancelado por usuario' });
            toast.success('Pedido cancelado');
            if (onUpdate) onUpdate();
        } catch (error) {
            toast.error('Error al cancelar');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition overflow-hidden flex flex-col group relative">
            {/* Status Strip */}
            <div className={`h-1.5 w-full ${order.estatus_folio === 'Cancelado' ? 'bg-red-500' :
                order.estatus_pago === 'Pagado' ? 'bg-green-500' : 'bg-yellow-400'
                }`} />

            <div className="p-5 flex-1 flex flex-col gap-3">
                <div className="flex justify-between items-start">
                    <span className="font-mono text-xs font-bold text-gray-400">
                        {order.folio_numero || `#${order.id}`}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${order.estatus_folio === 'Cancelado' ? 'bg-red-100 text-red-700' :
                        order.estatus_produccion === 'Terminado' ? 'bg-green-100 text-green-700' :
                            'bg-blue-100 text-blue-700'
                        }`}>
                        {order.estatus_folio === 'Cancelado' ? 'CANCELADO' : order.estatus_produccion}
                    </span>
                </div>

                <div>
                    <h3 className="font-bold text-gray-800 text-lg truncate" title={order.cliente_nombre}>
                        {order.cliente_nombre || 'Cliente Anónimo'}
                    </h3>
                    <p className="text-gray-500 text-sm line-clamp-2 min-h-[40px]">
                        {order.descripcion_diseno || 'Sin descripción detallada'}
                    </p>
                </div>

                {/* Quick Stats Grid */}
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 mt-2">
                    <div className="bg-gray-50 p-2 rounded-lg">
                        <span className="block font-semibold text-gray-700">Entrega</span>
                        {order.fecha_entrega} {order.hora_entrega}
                    </div>
                    <div className={`p-2 rounded-lg ${order.estatus_pago === 'Pagado' ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'}`}>
                        <span className="block font-semibold">Pago</span>
                        {order.estatus_pago}
                    </div>
                </div>
            </div>

            {/* Action Bar */}
            <div className="bg-gray-50 p-3 grid grid-cols-4 gap-2 border-t border-gray-100">
                <button
                    onClick={handlePrintPdf}
                    title="Imprimir Pedido"
                    className="flex items-center justify-center p-2 rounded-lg bg-white border border-gray-200 text-gray-600 hover:text-blue-600 hover:border-blue-300 transition"
                >
                    <FileText size={18} />
                </button>

                {order.estatus_pago !== 'Pagado' && order.estatus_folio !== 'Cancelado' && (
                    <button
                        onClick={() => handleStatusUpdate('Pagado')}
                        title="Marcar Pagado"
                        disabled={loading}
                        className="flex items-center justify-center p-2 rounded-lg bg-white border border-gray-200 text-green-600 hover:bg-green-50 hover:border-green-300 transition"
                    >
                        <DollarSign size={18} />
                    </button>
                )}

                {order.estatus_folio !== 'Cancelado' && (
                    <button
                        onClick={handlePrintLabel}
                        title="Imprimir Etiqueta"
                        className="flex items-center justify-center p-2 rounded-lg bg-white border border-gray-200 text-purple-600 hover:bg-purple-50 hover:border-purple-300 transition"
                    >
                        <Package size={18} />
                    </button>
                )}

                <button
                    onClick={handleCancel}
                    title="Cancelar"
                    disabled={loading || order.estatus_folio === 'Cancelado'}
                    className="flex items-center justify-center p-2 rounded-lg bg-white border border-gray-200 text-red-400 hover:text-red-600 hover:bg-red-50 hover:border-red-300 transition"
                >
                    <XCircle size={18} />
                </button>
            </div>
        </div>
    );
};

export default OrderCard;
