import React, { useEffect, useState } from 'react';
import { X, User, Phone, DollarSign, FileText, Clock, Calendar, CheckCircle, Package } from 'lucide-react';
import { ordersApi } from '../../services/ordersApi';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const EventDetailModal = ({ eventId, onClose }) => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);

    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true);
                const res = await ordersApi.getCalendarDetail(eventId);
                setData(res.data);
            } catch (e) {
                console.error(e);
                toast.error("Error cargando detalles");
                onClose();
            } finally {
                setLoading(false);
            }
        };
        if (eventId) load();
    }, [eventId, onClose]);

    if (!eventId) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] flex flex-col relative overflow-hidden">

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 bg-white/50 hover:bg-gray-100 rounded-full transition z-10"
                >
                    <X size={20} className="text-gray-500" />
                </button>

                {loading ? (
                    <div className="p-12 flex flex-col items-center justify-center gap-4">
                        <div className="w-10 h-10 border-4 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-gray-400 font-medium">Cargando detalles...</p>
                    </div>
                ) : data ? (
                    <>
                        {/* Header Image/Color */}
                        <div className={`h-24 ${data.estatus_pago === 'Pagado' ? 'bg-gradient-to-r from-green-400 to-emerald-500' : 'bg-gradient-to-r from-amber-300 to-orange-400'} flex items-end p-6`}>
                            <h2 className="text-white font-bold text-2xl drop-shadow-md">
                                {data.folio_numero}
                            </h2>
                        </div>

                        {/* Content */}
                        <div className="p-6 space-y-5 overflow-y-auto">

                            {/* Main Info */}
                            <div className="flex items-start gap-4">
                                <div className="bg-pink-50 p-3 rounded-xl text-pink-600">
                                    <User size={24} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-800">{data.cliente_nombre}</h3>
                                    <div className="flex items-center gap-2 text-gray-500 text-sm mt-1">
                                        <Phone size={14} />
                                        <span>{data.cliente_telefono}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Status Badges */}
                            <div className="flex gap-2">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${data.estatus_pago === 'Pagado' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                    {data.estatus_pago === 'Pagado' ? 'PAGADO' : 'PENDIENTE PAGO'}
                                </span>
                                <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-bold uppercase">
                                    {data.estatus_produccion}
                                </span>
                            </div>

                            <hr className="border-gray-100" />

                            {/* Delivery */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-gray-400 uppercase font-bold mb-1">Fecha Entrega</p>
                                    <div className="flex items-center gap-2 text-gray-700 font-medium">
                                        <Calendar size={16} className="text-pink-400" />
                                        <span>{data.fecha_entrega}</span>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 uppercase font-bold mb-1">Hora</p>
                                    <div className="flex items-center gap-2 text-gray-700 font-medium">
                                        <Clock size={16} className="text-pink-400" />
                                        <span>{data.hora_entrega}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Total */}
                            <div className="bg-gray-50 p-4 rounded-xl flex justify-between items-center">
                                <div className="flex items-center gap-2 text-gray-500">
                                    <DollarSign size={20} />
                                    <span className="font-medium">Total</span>
                                </div>
                                <span className="text-2xl font-bold text-gray-800">
                                    ${Number(data.total).toFixed(2)}
                                </span>
                            </div>

                            {/* Notes */}
                            {data.descripcion_diseno && (
                                <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100">
                                    <div className="flex items-center gap-2 text-yellow-700 mb-2 font-bold text-sm">
                                        <FileText size={16} />
                                        Notas / Diseño
                                    </div>
                                    <p className="text-sm text-gray-700 italic">
                                        "{data.descripcion_diseno}"
                                    </p>
                                </div>
                            )}

                        </div>

                        {/* Actions */}
                        <div className="p-6 border-t border-gray-100 bg-gray-50 flex gap-3">
                            {/* Print Dropdown */}
                            <div className="relative group">
                                <button className="px-4 py-3 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition shadow-sm flex items-center gap-2">
                                    <Package size={20} className="text-purple-600" />
                                    <span>Etiqueta</span>
                                </button>
                                <div className="absolute bottom-full left-0 mb-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden hidden group-hover:block z-50">
                                    <button
                                        onClick={() => {
                                            import('../../utils/pdfHelper').then(({ handlePdfResponse }) => {
                                                handlePdfResponse(() => ordersApi.downloadLabel(data.id, 'thermal'));
                                            });
                                        }}
                                        className="w-full text-left px-4 py-3 text-sm hover:bg-purple-50 text-gray-700 font-medium border-b border-gray-50"
                                    >
                                        Ticket (80mm)
                                    </button>
                                    <button
                                        onClick={() => {
                                            import('../../utils/pdfHelper').then(({ handlePdfResponse }) => {
                                                handlePdfResponse(() => ordersApi.downloadLabel(data.id, 'a4'));
                                            });
                                        }}
                                        className="w-full text-left px-4 py-3 text-sm hover:bg-purple-50 text-gray-700 font-medium"
                                    >
                                        Hoja (A4)
                                    </button>
                                </div>
                            </div>

                            <button
                                onClick={() => navigate(`/pedidos/${data.id}/editar`)}
                                className="flex-1 py-3 bg-pink-600 hover:bg-pink-700 text-white font-bold rounded-xl transition shadow-lg shadow-pink-200"
                            >
                                Editar Pedido
                            </button>
                        </div>
                    </>
                ) : null}
            </div>
        </div>
    );
};

export default EventDetailModal;
