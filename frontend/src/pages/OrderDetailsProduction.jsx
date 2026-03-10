import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Clock, Calendar, FileText, User, Printer, Tag, AlertTriangle, Flame } from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
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

    const handlePrint = (type) => {
        window.open(`${import.meta.env.VITE_API_URL}/folios/${id}/pdf?type=${type}`, '_blank');
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Cargando detalles...</div>;
    if (!order) return <div className="p-8 text-center text-red-500">Pedido no encontrado</div>;

    const specs = [
        { label: "Sabor de Pan", value: order.sabores_pan ? (typeof order.sabores_pan === 'string' ? JSON.parse(order.sabores_pan).join(', ') : order.sabores_pan.join(', ')) : 'N/A', icon: Flame, color: 'text-orange-600' },
        { label: "Relleno", value: order.rellenos ? (typeof order.rellenos === 'string' ? JSON.parse(order.rellenos).join(', ') : order.rellenos.join(', ')) : 'N/A', icon: CheckCircle, color: 'text-purple-600' },
        { label: "Forma/Pisos", value: `${order.forma || 'N/A'} - ${order.tipo_folio || 'Normal'}` },
        { label: "Personas", value: order.numero_personas || 'N/A' },
        { label: "Dedicatoria", value: order.diseno_metadata?.dedicatoria || order.dedicatoria || 'Ninguna' }
    ];

    return (
        <div className="p-6 max-w-5xl mx-auto space-y-6 fade-in pb-20">
            <div className="flex justify-between items-center mb-4">
                <button onClick={() => navigate(-1)} className="flex items-center text-gray-600 hover:text-pink-600 font-medium tracking-tight">
                    <ArrowLeft size={20} className="mr-2" /> Panel de Producción
                </button>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handlePrint('comanda')} icon={Printer}>Comanda</Button>
                    <Button variant="outline" size="sm" onClick={() => handlePrint('label')} icon={Tag}>Etiqueta</Button>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <h1 className="text-4xl font-black text-gray-900 tracking-tight">{order.folio_numero}</h1>
                            <Badge variant={order.estatus_produccion === 'Terminado' ? 'success' : 'warning'} className="text-sm py-1 capitalize">
                                {order.estatus_produccion || 'Pendiente'}
                            </Badge>
                        </div>
                        <p className="text-lg text-gray-600 font-medium flex items-center gap-2">
                            <User size={20} className="text-gray-400" /> {order.cliente_nombre}
                        </p>
                    </div>

                    <div className="flex gap-3 w-full md:w-auto">
                        {order.estatus_produccion !== 'Terminado' && (
                            <>
                                <button
                                    onClick={() => handleStatusUpdate('En Proceso')}
                                    className={`flex-1 md:flex-none px-6 py-3 rounded-xl font-bold transition-all ${order.estatus_produccion === 'En Proceso' ? 'bg-orange-100 text-orange-700 ring-2 ring-orange-400' : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'}`}
                                >
                                    EN HORNO
                                </button>
                                <button
                                    onClick={() => handleStatusUpdate('Terminado')}
                                    className="flex-1 md:flex-none px-8 py-3 rounded-xl font-bold bg-green-600 text-white hover:bg-green-700 shadow-lg shadow-green-200 active:scale-95 transition-all"
                                >
                                    ¡LISTO!
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {order.diseno_metadata?.alergias && (
                <div className="bg-red-50 border-2 border-red-200 p-4 rounded-xl flex items-center gap-4 animate-bounce">
                    <AlertTriangle size={32} className="text-red-600" />
                    <div>
                        <h3 className="text-red-800 font-black text-lg">ALERTA DE ALERGIA</h3>
                        <p className="text-red-700 font-bold">{order.diseno_metadata.alergias}</p>
                    </div>
                </div>
            )}

            <div className="grid md:grid-cols-2 gap-8">
                {/* Visual Reference Column */}
                <div className="space-y-6">
                    <Card title="Referencia de Diseño" className="overflow-hidden">
                        {order.imagen_referencia_url ? (
                            <div className="rounded-xl overflow-hidden border border-gray-100 bg-gray-50">
                                <img
                                    src={`${import.meta.env.VITE_API_URL}${order.imagen_referencia_url}`.replace('/api', '')}
                                    alt="Referencia"
                                    className="w-full h-auto object-contain max-h-[500px]"
                                />
                            </div>
                        ) : (
                            <div className="h-64 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400">
                                <FileText size={48} className="mb-2 opacity-50" />
                                <span className="font-medium text-sm">Cargar imagen en mostrador</span>
                            </div>
                        )}
                        <div className="mt-4 p-5 bg-blue-50/50 rounded-2xl border border-blue-100">
                            <h4 className="text-blue-900 font-black text-sm uppercase tracking-wider mb-2">Instrucciones de Decoración</h4>
                            <p className="text-blue-800 font-medium leading-relaxed whitespace-pre-wrap">{order.descripcion_diseno || "Sin descripción decorativa."}</p>
                        </div>
                    </Card>
                </div>

                {/* Specs Column */}
                <div className="space-y-6">
                    <Card title="Ficha Técnica de Producción">
                        <div className="grid gap-4">
                            {specs.map((spec, idx) => (
                                <div key={idx} className="flex flex-col p-3 rounded-xl bg-gray-50 border border-gray-100">
                                    <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">{spec.label}</span>
                                    <div className="flex items-center gap-2">
                                        {spec.icon && <spec.icon size={16} className={spec.color} />}
                                        <span className={`font-bold text-gray-900 ${spec.color ? 'text-lg' : 'text-base'}`}>{spec.value}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>

                    <Card title="Logística de Entrega" className="bg-gray-900 text-white">
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <span className="text-gray-400 text-[10px] font-black uppercase tracking-tighter">Fecha Prometida</span>
                                    <div className="flex items-center gap-2">
                                        <Calendar className="text-pink-400" size={20} />
                                        <span className="font-black text-2xl">{order.fecha_entrega}</span>
                                    </div>
                                </div>
                                <div className="space-y-1 text-right">
                                    <span className="text-gray-400 text-[10px] font-black uppercase tracking-tighter">Hora Límite</span>
                                    <div className="flex items-center justify-end gap-2">
                                        <Clock className="text-blue-400" size={20} />
                                        <span className="font-black text-2xl">{order.hora_entrega} <span className="text-xs">HRS</span></span>
                                    </div>
                                </div>
                            </div>

                            {order.ubicacion_entrega && (
                                <div className="pt-4 border-t border-gray-800">
                                    <span className="text-gray-400 text-[10px] font-black uppercase tracking-tighter">Punto de Entrega</span>
                                    <p className="font-bold text-lg text-gray-100 mt-1">{order.ubicacion_entrega}</p>
                                </div>
                            )}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default OrderDetailsProduction;
