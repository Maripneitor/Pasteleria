import { useState } from 'react';
import { FileText, Edit, Trash2, XCircle, DollarSign, Package, Bot, CheckCircle } from 'lucide-react';
import client from '../config/axios';
import { foliosApi } from '../features/folios/api/folios.api';
import { handlePdfResponse } from '../utils/pdfHelper'; // Import helper
import toast from 'react-hot-toast';

const OrderCard = ({ order, onUpdate }) => {
    const [loading, setLoading] = useState(false);

    // Identificador visual de la IA
    const isDraft = order.status === 'DRAFT';

    const handlePrintPdf = () => {
        handlePdfResponse(() => foliosApi.downloadPdf(order.id));
    };

    const handlePrintLabel = () => {
        handlePdfResponse(() => foliosApi.downloadLabel(order.id));
    };

    const handleStatusUpdate = async (newStatus) => {
        setLoading(true);
        try {
            if (newStatus === 'Pagado') {
                await client.put(`/folios/${order.id}`, { estatus_pago: 'Pagado' });
                toast.success('Marcado como Pagado');
            } else {
                // Actualiza el status (ej. DRAFT -> CONFIRMED)
                await client.patch(`/folios/${order.id}/status`, { status: newStatus });
                toast.success(newStatus === 'CONFIRMED' ? '¡Pedido aprobado y confirmado!' : `Estado actualizado a ${newStatus}`);
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
        if (!confirm('¿Estás seguro de cancelar/rechazar este pedido?')) return;
        setLoading(true);
        try {
            await client.patch(`/folios/${order.id}/cancel`, { motivo: 'Cancelado por usuario' });
            toast.success('Pedido cancelado');
            if (onUpdate) onUpdate();
        } catch {
            toast.error('Error al cancelar');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`bg-white rounded-2xl shadow-sm hover:shadow-md transition overflow-hidden flex flex-col group relative ${isDraft ? 'border-2 border-purple-300' : 'border border-gray-100'}`}>
            
            {/* Status Strip */}
            <div className={`h-1.5 w-full ${order.estatus_folio === 'Cancelado' ? 'bg-red-500' :
                isDraft ? 'bg-purple-500' :
                order.estatus_pago === 'Pagado' ? 'bg-green-500' : 'bg-yellow-400'
                }`} />

            <div className="p-5 flex-1 flex flex-col gap-3 bg-white">
                <div className="flex justify-between items-start">
                    <span className="font-mono text-xs font-bold text-gray-400">
                        {order.folio_numero || `#${order.id}`}
                    </span>
                    
                    {/* ETIQUETA INTELIGENTE: Si es borrador, brilla en morado */}
                    {isDraft ? (
                        <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wider bg-purple-100 text-purple-700 border border-purple-200">
                            <Bot size={14} className="animate-pulse" />
                            Borrador IA
                        </span>
                    ) : (
                        <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${order.estatus_folio === 'Cancelado' ? 'bg-red-100 text-red-700' :
                            order.estatus_produccion === 'Terminado' ? 'bg-green-100 text-green-700' :
                                'bg-blue-100 text-blue-700'
                            }`}>
                            {order.estatus_folio === 'Cancelado' ? 'CANCELADO' : order.estatus_produccion}
                        </span>
                    )}
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

            {/* BARRA DE ACCIONES DINÁMICA */}
            {isDraft ? (
                /* ACCIONES EXCLUSIVAS PARA BORRADOR DE IA */
                <div className="bg-purple-50 p-3 flex gap-2 border-t border-purple-100">
                    <button
                        onClick={() => handleStatusUpdate('CONFIRMED')}
                        disabled={loading}
                        className="flex-1 flex items-center justify-center gap-2 p-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition font-bold text-sm shadow-sm"
                    >
                        <CheckCircle size={18} />
                        Aprobar Pedido
                    </button>
                    <button
                        onClick={handleCancel}
                        title="Rechazar/Cancelar"
                        disabled={loading}
                        className="flex items-center justify-center p-2 rounded-lg bg-white border border-red-200 text-red-500 hover:text-red-700 hover:bg-red-50 transition shadow-sm"
                    >
                        <XCircle size={20} />
                    </button>
                </div>
            ) : (
                /* ACCIONES NORMALES DE PRODUCCIÓN */
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
                        <div className="relative group/print">
                            <button
                                className="flex items-center justify-center p-2 w-full rounded-lg bg-white border border-gray-200 text-purple-600 hover:bg-purple-50 hover:border-purple-300 transition"
                                title="Imprimir Etiqueta"
                            >
                                <Package size={18} />
                            </button>

                            <div className="absolute bottom-full right-0 mb-2 w-40 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden hidden group-hover/print:block z-20">
                                <button
                                    onClick={() => handlePdfResponse(() => foliosApi.downloadLabel(order.id, 'thermal'))}
                                    className="w-full text-left px-4 py-2 text-sm hover:bg-purple-50 text-gray-700 font-medium"
                                >
                                    Ticket (80mm)
                                </button>
                                <button
                                    onClick={() => handlePdfResponse(() => foliosApi.downloadLabel(order.id, 'a4'))}
                                    className="w-full text-left px-4 py-2 text-sm hover:bg-purple-50 text-gray-700 font-medium"
                                >
                                    Hoja (A4)
                                </button>
                            </div>
                        </div>
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
            )}
        </div>
    );
};

export default OrderCard;