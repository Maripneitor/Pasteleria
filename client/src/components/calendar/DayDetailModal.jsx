import React from 'react';
import { FileText, X, Package, Edit, DollarSign } from 'lucide-react';
import { ordersApi } from '../../services/ordersApi';
import { handlePdfResponse } from '../../utils/pdfHelper'; // Updated
import { useNavigate } from 'react-router-dom';

const DayDetailModal = ({ date, events, onClose }) => {
    const navigate = useNavigate();
    const formattedDate = new Date(date).toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const dateStr = date.toISOString().split('T')[0];

    const handlePrintDaySummary = () => {
        handlePdfResponse(() => ordersApi.downloadDaySummary(dateStr));
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-2xl">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800 capitalize">{formattedDate}</h2>
                        <p className="text-sm text-gray-500">{events.length} Pedido(s) programado(s)</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition">
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {events.length === 0 ? (
                        <div className="text-center py-10 text-gray-400">
                            No hay entregas para este día.
                        </div>
                    ) : (
                        events.map(evt => {
                            const data = evt.extendedProps;
                            return (
                                <div key={evt.id} className="border border-gray-100 rounded-xl p-4 hover:shadow-md transition flex justify-between items-center group">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-mono text-xs font-bold text-gray-400">#{data.folio_numero || evt.id}</span>
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${data.estatus_pago === 'Pagado' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                                }`}>
                                                {data.estatus_pago}
                                            </span>
                                        </div>
                                        <h4 className="font-bold text-gray-800">{data.cliente_nombre}</h4>
                                        <h4 className="font-bold text-gray-500 text-xs">{data.hora_entrega}</h4>
                                    </div>

                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            title="Editar"
                                            onClick={() => navigate(`/pedidos/${data.id}/editar`)}
                                            className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"
                                        >
                                            <Edit size={16} />
                                        </button>
                                        <button
                                            title="PDF Pedido"
                                            onClick={() => handlePdfResponse(() => ordersApi.downloadPdf(data.id))}
                                            className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"
                                        >
                                            <FileText size={16} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 flex justify-between bg-gray-50 rounded-b-2xl">
                    <button
                        onClick={() => navigate('/pedidos/nuevo')}
                        className="px-4 py-2 text-sm font-bold text-pink-600 hover:bg-pink-50 rounded-lg transition"
                    >
                        + Nuevo Pedido
                    </button>
                    {events.length > 0 && (
                        <button
                            onClick={handlePrintDaySummary}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg font-bold hover:bg-gray-900 transition shadow-lg shadow-gray-200"
                        >
                            <FileText size={18} /> Imprimir Resumen del Día
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DayDetailModal;
