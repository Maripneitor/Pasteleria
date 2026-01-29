import { useState } from 'react';
import { FileText, Edit, Trash2, XCircle } from 'lucide-react';
import client from '../config/axios';
import toast from 'react-hot-toast';

const OrderCard = ({ order, onUpdate }) => {
    const [imageLoaded, setImageLoaded] = useState(false);
    const [loading, setLoading] = useState(false);
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
    const baseUrl = apiUrl.replace(/\/api\/?$/, '');

    const imageUrl = order.imagen_referencia_url
        ? `${baseUrl}${order.imagen_referencia_url.startsWith('/') ? '' : '/'}${order.imagen_referencia_url}`
        : null;

    const handlePrintPdf = () => {
        try {
            const pdfUrl = `${apiUrl}/folios/${order.id}/pdf`;
            window.open(pdfUrl, '_blank');
        } catch (error) {
            console.error("Error al abrir PDF:", error);
            toast.error("Error al abrir el PDF");
        }
    };

    const handleCancel = async () => {
        if (!confirm('¿Estás seguro de cancelar este pedido?')) return;
        setLoading(true);
        try {
            await client.patch(`/folios/${order.id}/cancel`); // Assuming endpoint
            // Wait, implementation plan said PATCH /status or custom routing. 
            // Need to verify backend route for Cancel.
            // User requested: PATCH /folios/:id/cancel
            toast.success('Pedido cancelado');
            if (onUpdate) onUpdate();
        } catch (error) {
            toast.error('Error al cancelar');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('⚠️ ¿Eliminar pedido permanentemente? Solo admin.')) return;
        setLoading(true);
        try {
            await client.delete(`/folios/${order.id}`);
            toast.success('Pedido eliminado');
            if (onUpdate) onUpdate();
        } catch (error) {
            toast.error('Error al eliminar');
        } finally {
            setLoading(false);
        }
    };

    // Status colors
    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'nuevo': return 'bg-blue-100 text-blue-700';
            case 'produccion': return 'bg-yellow-100 text-yellow-700';
            case 'terminado': return 'bg-green-100 text-green-700';
            case 'entregado': return 'bg-gray-100 text-gray-600';
            case 'cancelado': return 'bg-red-100 text-red-700';
            default: return 'bg-gray-100 text-gray-500';
        }
    };

    // Format currency
    const formatMoney = (amount) => {
        return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition overflow-hidden flex flex-col">
            {imageUrl && (
                <div className="h-40 bg-gray-50 relative overflow-hidden border-b border-gray-100">
                    <img
                        src={imageUrl}
                        alt="Referencia"
                        className={`w-full h-full object-cover transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                        onLoad={() => setImageLoaded(true)}
                        onError={(e) => { e.target.style.display = 'none'; }}
                    />
                    {!imageLoaded && (
                        <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-xs">
                            Cargando imagen...
                        </div>
                    )}
                </div>
            )}

            <div className="p-5 flex-1 flex flex-col gap-3">
                <div className="flex justify-between items-start">
                    <span className="font-mono text-xs font-bold text-gray-400">#{order.folioNumber || order.id}</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${getStatusColor(order.estatus_produccion || order.status)}`}>
                        {order.estatus_produccion || order.status}
                    </span>
                </div>

                <div>
                    <h3 className="font-bold text-gray-800 text-lg truncate" title={order.cliente_nombre || order.clientName}>
                        {order.cliente_nombre || order.clientName || 'Cliente Anónimo'}
                    </h3>
                    <p className="text-gray-500 text-sm line-clamp-2 min-h-[40px]">
                        {order.descripcion_diseno || order.description || 'Sin descripción'}
                    </p>
                </div>

                <div className="flex justify-between items-center text-sm border-t border-gray-50 pt-3 mt-auto">
                    <div className="flex flex-col">
                        <span className="text-gray-400 text-xs">Entrega</span>
                        <span className="font-semibold text-gray-700">{order.fecha_entrega || order.deliveryDate}</span>
                    </div>
                    <div className="flex flex-col text-right">
                        <span className="text-gray-400 text-xs">Total</span>
                        <span className="font-bold text-pink-600 text-lg">
                            {formatMoney(order.total)}
                        </span>
                    </div>
                </div>
            </div>

            <div className="bg-gray-50 p-3 flex justify-between items-center gap-2 border-t border-gray-100">
                <button
                    onClick={handlePrintPdf}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-white border border-gray-200 rounded-lg text-gray-700 text-sm font-medium hover:bg-gray-50 transition"
                >
                    <FileText size={16} /> PDF
                </button>
                {/* 
                <button 
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                    title="Editar"
                    onClick={() => toast('Función Editar en desarrollo')}
                >
                    <Edit size={18} />
                </button>
                 */}
                <button
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                    title="Cancelar"
                    onClick={handleCancel}
                    disabled={loading}
                >
                    <XCircle size={18} />
                </button>
                <button
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                    title="Eliminar"
                    onClick={handleDelete}
                    disabled={loading}
                >
                    <Trash2 size={18} />
                </button>
            </div>
        </div>
    );
};

export default OrderCard;
