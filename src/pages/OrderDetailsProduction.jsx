import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Clock, Calendar, FileText, User } from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import api from '../config/axios';
import toast from 'react-hot-toast';

const OrderDetailsProduction = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                const res = await api.get(`/folios/${id}`);
                setOrder(res.data);
            } catch (error) {
                console.error(error);
                toast.error("Error al cargar detalles del pedido");
            } finally {
                setLoading(false);
            }
        };
        fetchOrder();
    }, [id]);

    const handleStatusUpdate = async (newStatus) => {
        try {
            await api.patch(`/folios/${id}/status`, { status: newStatus });
            setOrder({ ...order, estatus_produccion: newStatus });
            toast.success(`Estatus actualizado a: ${newStatus}`);
        } catch (e) {
            console.error(e);
            toast.error("Error al actualizar estatus");
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Cargando detalles...</div>;
    if (!order) return <div className="p-8 text-center text-red-500">Pedido no encontrado</div>;

    const specs = [
        { label: "Sabor", value: order.sabores_pan ? JSON.parse(order.sabores_pan).join(', ') : 'N/A' },
        { label: "Relleno", value: order.rellenos ? JSON.parse(order.rellenos).join(', ') : 'N/A' },
        { label: "Forma/Pisos", value: `${order.forma || 'N/A'} - ${order.tipo_folio || 'Normal'}` },
        { label: "Personas", value: order.numero_personas || 'N/A' },
        { label: "Dedicatoria", value: order.diseno_metadata?.dedicatoria || 'Ninguna' }
    ];

    return (
        <div className="p-6 max-w-5xl mx-auto space-y-6 fade-in pb-20">
            <button onClick={() => navigate(-1)} className="flex items-center text-gray-600 hover:text-pink-600 font-medium mb-4">
                <ArrowLeft size={20} className="mr-2" /> Volver
            </button>

            <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">{order.folio_numero}</h1>
                    <p className="text-gray-500 mt-1 flex items-center gap-2">
                        <User size={16} /> {order.cliente_nombre}
                    </p>
                </div>
                <div className="flex gap-2">
                    {order.estatus_produccion === 'Terminado' ? (
                        <span className="bg-green-100 text-green-700 px-4 py-2 rounded-full font-bold flex items-center gap-2">
                            <CheckCircle size={18} /> Terminado
                        </span>
                    ) : (
                        <div className="flex gap-2">
                            <button
                                onClick={() => handleStatusUpdate('En Proceso')}
                                className={`px-4 py-2 rounded-lg font-medium transition ${order.estatus_produccion === 'En Proceso' ? 'bg-yellow-100 text-yellow-700 ring-2 ring-yellow-400' : 'bg-white border hover:bg-gray-50'}`}
                            >
                                En Proceso
                            </button>
                            <button
                                onClick={() => handleStatusUpdate('Terminado')}
                                className="px-4 py-2 rounded-lg font-medium bg-green-600 text-white hover:bg-green-700 shadow-sm"
                            >
                                Marcar Terminado
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
                {/* Visual Reference Column */}
                <div className="space-y-6">
                    <Card title="Referencia Visual">
                        {order.imagen_referencia_url ? (
                            <div className="rounded-xl overflow-hidden border border-gray-200">
                                <img
                                    src={`${import.meta.env.VITE_API_URL}${order.imagen_referencia_url}`.replace('/api', '')}
                                    alt="Referencia"
                                    className="w-full h-auto object-contain bg-gray-50"
                                />
                            </div>
                        ) : (
                            <div className="h-64 bg-gray-50 rounded-xl border border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400">
                                <FileText size={48} className="mb-2 opacity-50" />
                                <span>Sin imagen de referencia</span>
                            </div>
                        )}
                        <div className="mt-4 p-4 bg-yellow-50 rounded-lg text-yellow-800 text-sm">
                            <strong>Descripción Diseño:</strong>
                            <p className="mt-1 whitespace-pre-wrap">{order.descripcion_diseno || "Sin descripción detallada."}</p>
                        </div>
                    </Card>
                </div>

                {/* Specs Column */}
                <div className="space-y-6">
                    <Card title="Especificaciones Técnicas">
                        <div className="divide-y divide-gray-100">
                            {specs.map((spec, idx) => (
                                <div key={idx} className="py-3 flex justify-between">
                                    <span className="text-gray-500 font-medium">{spec.label}</span>
                                    <span className="text-gray-900 font-bold text-right">{spec.value}</span>
                                </div>
                            ))}
                        </div>
                    </Card>

                    <Card title="Logística">
                        <div className="flex items-center gap-3 mb-2">
                            <Calendar className="text-pink-500" />
                            <span className="font-bold text-lg">{order.fecha_entrega}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <Clock className="text-blue-500" />
                            <span className="font-bold text-lg">{order.hora_entrega} hrs</span>
                        </div>
                        {order.ubicacion_entrega && (
                            <div className="mt-4 pt-4 border-t border-gray-100">
                                <span className="text-xs text-gray-500 uppercase tracking-wide">Entrega en:</span>
                                <p className="font-medium text-gray-800">{order.ubicacion_entrega}</p>
                            </div>
                        )}
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default OrderDetailsProduction;
