import React from 'react';
import { FileText, X, Edit, Eye, Clock, User, Package, CalendarDays } from 'lucide-react';
import { foliosApi } from '@/features/folios/api/folios.api';
import { handlePdfResponse } from '@/utils/pdfHelper'; 
import { useNavigate } from 'react-router-dom';

const DayDetailModal = ({ date, events, onClose }) => {
    const navigate = useNavigate();
    const formattedDate = new Date(date).toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const dateStr = date.toISOString().split('T')[0];

    const handlePrintDaySummary = () => {
        handlePdfResponse(() => foliosApi.downloadDaySummary(dateStr));
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-gray-900/60 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden relative border border-white/20">
                {/* Decorative Background Blob */}
                <div className="absolute top-0 right-0 -mt-20 -mr-20 w-64 h-64 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-64 h-64 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 pointer-events-none"></div>

                {/* Header */}
                <div className="p-6 sm:p-8 flex justify-between items-start z-10 bg-white/80 backdrop-blur border-b border-gray-100">
                    <div className="flex gap-4 items-center">
                        <div className="w-14 h-14 bg-gradient-to-br from-pink-500 to-rose-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-pink-200">
                            <CalendarDays size={28} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-gray-800 tracking-tight capitalize">{formattedDate}</h2>
                            <p className="text-sm font-medium text-gray-500 flex items-center gap-1 mt-1">
                                <Package size={14} />
                                {events.length} Pedido(s) programados para hoy
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-4 z-10 bg-gray-50/50">
                    {events.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center space-y-4 py-12">
                            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center text-gray-300 mb-2">
                                <CalendarDays size={48} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-700">Día sin programar</h3>
                            <p className="text-gray-500 max-w-sm">No tienes ninguna entrega o pedido registrado para esta fecha.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {events.map(evt => {
                                const data = evt.extendedProps;
                                const isCancelado = data.estatus_folio === 'Cancelado';
                                const isPagado = data.estatus_pago === 'Pagado';

                                return (
                                    <div key={evt.id} className="group bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-xl hover:border-pink-200 transition-all duration-300 flex flex-col relative overflow-hidden">
                                        {/* Status Bar */}
                                        <div className={`absolute top-0 left-0 w-1 h-full ${
                                            isCancelado ? 'bg-red-500' : isPagado ? 'bg-green-500' : 'bg-yellow-500'
                                        }`} />

                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono text-sm font-black text-gray-800">
                                                    #{data.folio_numero || evt.id}
                                                </span>
                                                <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${
                                                    isCancelado ? 'bg-red-100 text-red-700' :
                                                    isPagado ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                    {isCancelado ? 'Cancelado' : data.estatus_pago}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1 bg-gray-50 text-gray-500 px-2 py-1 rounded-lg text-xs font-bold">
                                                <Clock size={12} className="text-pink-500" />
                                                {data.hora_entrega}
                                            </div>
                                        </div>

                                        <div className="flex-1">
                                            <h4 className="font-bold text-gray-800 text-lg line-clamp-1 mb-1" title={data.cliente_nombre}>
                                                {data.cliente_nombre}
                                            </h4>
                                            <p className="text-sm text-gray-500 flex items-center gap-1">
                                                <User size={14} /> Cliente
                                            </p>
                                        </div>

                                        {/* Acciones flotantes en hover */}
                                        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-end gap-2">
                                            <button
                                                title="Editar"
                                                onClick={() => { onClose(); navigate(`/pedidos/${evt.id}/editar`); }}
                                                className="p-2.5 text-blue-600 hover:bg-blue-50 rounded-xl transition"
                                            >
                                                <Edit size={18} />
                                            </button>
                                            <button
                                                title="PDF Pedido"
                                                onClick={() => handlePdfResponse(() => foliosApi.downloadPdf(evt.id))}
                                                className="p-2.5 text-gray-600 hover:bg-gray-100 rounded-xl transition"
                                            >
                                                <FileText size={18} />
                                            </button>
                                            <button
                                                title="Ver Detalle Completo"
                                                onClick={() => { onClose(); navigate(`/pedidos/${evt.id}`); }}
                                                className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-md shadow-pink-200 text-sm font-bold rounded-xl transition flex items-center gap-2 transform hover:-translate-y-0.5"
                                            >
                                                <Eye size={16} /> Ver
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 sm:p-8 border-t border-gray-100 bg-white/80 backdrop-blur flex justify-between items-center z-10">
                    <button
                        onClick={() => { onClose(); navigate('/pedidos/nuevo'); }}
                        className="px-6 py-3 font-bold text-pink-600 bg-pink-50 hover:bg-pink-100 rounded-xl transition"
                    >
                        + Nuevo Pedido
                    </button>
                    {events.length > 0 && (
                        <button
                            onClick={handlePrintDaySummary}
                            className="flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-black transition shadow-xl shadow-gray-200 transform hover:-translate-y-0.5"
                        >
                            <FileText size={18} /> Imprimir Resumen ({events.length})
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DayDetailModal;