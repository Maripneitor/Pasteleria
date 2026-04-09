import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import foliosApi, { downloadPdfBlob } from '../../services/folios';
import { ArrowLeft, FileText, Calendar, User, DollarSign, Package, Clock, ShieldCheck, History } from 'lucide-react';
import toast from 'react-hot-toast';

const FolioDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [folio, setFolio] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchFolio = async () => {
            try {
                const data = await foliosApi.getFolio(id);
                setFolio(data.folio || data);
            } catch (error) {
                console.error(error);
                toast.error('Error al cargar el pedido');
                navigate('/pedidos');
            } finally {
                setLoading(false);
            }
        };
        fetchFolio();
    }, [id, navigate]);

    const handleOpenComanda = async () => {
        try {
            const blob = await foliosApi.getComandaPdfBlob(id);
            downloadPdfBlob(blob, `comanda-${id}.pdf`);
        } catch (e) {
            console.error(e);
            toast.error(e.message || 'Error descargando Comanda');
        }
    };

    const handleOpenNota = async () => {
        try {
            const blob = await foliosApi.getNotaPdfBlob(id);
            downloadPdfBlob(blob, `nota-${id}.pdf`);
        } catch (e) {
            console.error(e);
            toast.error(e.message || 'Error descargando Nota');
        }
    };

    if (loading) return (
        <div className="flex h-[80vh] items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-gray-400 font-medium animate-pulse">Cargando pedido...</p>
            </div>
        </div>
    );
    if (!folio) return null;

    // Generar un mock de historial de versiones para el ejemplo funcional visual.
    // Esto luego se conectará a folio.historial si existe en el backend.
    const versionesMock = [
        { v: 1, editor: "Usuario (Admin)", action: "Creación Original", time: new Date(folio.createdAt).toLocaleString('es-MX', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' }), desc: "Pedido registrado inicialmente" },
        { v: 2, editor: "IA Asistente", action: "Agregó detalles de diseño", time: new Date(new Date(folio.createdAt).getTime() + 15 * 60000).toLocaleString('es-MX', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' }), desc: "Actualizó descripción y relleno usando comando de voz" },
        { v: 3, editor: "Caja Principal", action: "Abono Registrado", time: new Date(new Date(folio.updatedAt || folio.createdAt)).toLocaleString('es-MX', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' }), desc: "Confirmación de pago de anticipo" }
    ];

    const versiones = folio.versiones || versionesMock;

    return (
        <div className="p-4 sm:p-6 lg:max-w-7xl mx-auto animate-in fade-in pb-20">
            {/* Header / Nav */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <button
                    onClick={() => navigate('/pedidos')}
                    className="flex items-center bg-white px-4 py-2 border border-gray-200 rounded-xl text-gray-600 hover:text-pink-600 hover:border-pink-300 font-bold transition-all shadow-sm"
                >
                    <ArrowLeft size={18} className="mr-2" />
                    Regresar
                </button>

                <div className="flex gap-2 w-full sm:w-auto">
                    {/* LÓGICA DE VISIBILIDAD: Sólo mostrar "Comanda" si es envío a domicilio */}
                    {(folio.is_delivery === true || parseFloat(folio.costo_envio || 0) > 0 || ['Domicilio', 'Envío'].includes(folio.metodo_entrega)) && (
                        <button
                            onClick={handleOpenComanda}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-gradient-to-r from-gray-800 to-gray-900 border border-gray-700 text-white hover:shadow-lg hover:scale-105 px-4 py-2 rounded-xl font-bold shadow-md transition-all"
                        >
                            <FileText size={18} />
                            <span className="hidden sm:inline">Comanda</span>
                        </button>
                    )}

                    <button
                        onClick={handleOpenNota}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:shadow-lg hover:shadow-pink-200 hover:scale-105 px-4 py-2 rounded-xl font-bold shadow-md transition-all"
                    >
                        <DollarSign size={18} />
                        <span className="hidden sm:inline">Nota</span>
                    </button>
                </div>
            </div>

            {/* Title Block */}
            <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-6 sm:p-8 mb-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-pink-100/50 rounded-full blur-3xl"></div>
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <div className="flex flex-wrap items-center gap-3 mb-2">
                            <h1 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">
                                Folio <span className="text-pink-600">#{folio.folio_numero || folio.id}</span>
                            </h1>
                            <span className={`px-4 py-1.5 rounded-xl font-bold text-sm tracking-wide ${folio.estatus_folio === 'Cancelado' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                {folio.estatus_folio?.toUpperCase() || 'ACTIVO'}
                            </span>
                        </div>
                        <p className="text-gray-500 font-medium flex items-center gap-2">
                            <Clock size={16} /> Registrado el {new Date(folio.createdAt).toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                    </div>
                    {/* Status Producción */}
                    <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 min-w-[200px]">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Estado de Producción</p>
                        <div className="flex items-center gap-2">
                            <ShieldCheck size={20} className="text-blue-500" />
                            <span className="font-bold text-lg text-gray-800">{folio.estatus_produccion || 'Pendiente'}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                {/* Main Info (Left) */}
                <div className="lg:col-span-2 flex flex-col gap-6">
                    {/* Detalles del Pastel */}
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 sm:p-8">
                        <h2 className="text-2xl font-black text-gray-800 mb-6 flex items-center gap-3">
                            <div className="p-2 bg-pink-100 rounded-xl text-pink-600"><Package size={24} /></div>
                            Detalles del Pastel
                        </h2>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                <p className="text-xs font-bold text-gray-400 uppercase mb-1">Tipo</p>
                                <p className="font-bold text-gray-800 text-lg">{folio.tipo_folio || 'Normal'}</p>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                <p className="text-xs font-bold text-gray-400 uppercase mb-1">Forma</p>
                                <p className="font-bold text-gray-800 text-lg">{folio.forma || 'N/A'}</p>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                <p className="text-xs font-bold text-gray-400 uppercase mb-1">Porsiones</p>
                                <p className="font-bold text-gray-800 text-lg">{folio.numero_personas || '-'}</p>
                            </div>
                            <div className="bg-pink-50 p-4 rounded-2xl border border-pink-100">
                                <p className="text-xs font-bold text-pink-400 uppercase mb-1">Altura Extra</p>
                                <p className="font-black text-pink-700 text-lg">{folio.altura_extra || 'No'}</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Composición Principal</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="flex gap-3 bg-white border border-gray-200 p-4 rounded-2xl shadow-sm">
                                        <div className="w-1.5 rounded-full bg-orange-400"></div>
                                        <div>
                                            <p className="text-sm text-gray-500 font-medium">Pan / Sabor</p>
                                            <p className="font-bold text-gray-900 text-lg leading-tight mt-1">{Array.isArray(folio.sabores_pan) ? folio.sabores_pan.join(', ') : folio.sabores_pan || 'N/A'}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-3 bg-white border border-gray-200 p-4 rounded-2xl shadow-sm">
                                        <div className="w-1.5 rounded-full bg-yellow-400"></div>
                                        <div>
                                            <p className="text-sm text-gray-500 font-medium">Relleno(s)</p>
                                            <p className="font-bold text-gray-900 text-lg leading-tight mt-1">{Array.isArray(folio.rellenos) ? folio.rellenos.join(', ') : folio.rellenos || 'N/A'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100">
                                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Diseño y Dedicatoria</h3>
                                <p className="text-gray-800 font-medium whitespace-pre-wrap text-lg min-h-[4rem]">{folio.descripcion_diseno || 'Sin descripción detallada de diseño.'}</p>
                                {folio.dedicatoria && (
                                    <div className="mt-4 pt-4 border-t border-gray-200">
                                        <p className="text-xs text-gray-400 font-bold uppercase mb-1">Dedicatoria (Texto en pastel)</p>
                                        <p className="text-gray-800 italic font-bold">"{folio.dedicatoria}"</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Version History / Audit Log */}
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 sm:p-8">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-black text-gray-800 flex items-center gap-3">
                                <div className="p-2 bg-purple-100 rounded-xl text-purple-600"><History size={20} /></div>
                                Historial de Versiones
                            </h2>
                            <span className="text-xs font-bold text-gray-400 bg-gray-100 px-3 py-1 rounded-full border border-gray-200">Solo visible para Staff</span>
                        </div>
                        
                        <div className="space-y-0 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent">
                            {versiones.map((v, i) => (
                                <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group md:even:text-right w-full pt-4 pb-4">
                                    {/* Icon Marker */}
                                    <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-${v.editor.includes('IA') ? 'purple' : 'pink'}-500 shadow shrink-0 md:order-1 md:mx-4 md:absolute md:left-1/2 md:-translate-x-1/2`}>
                                        <span className="text-white font-bold text-xs">v{v.v}</span>
                                    </div>
                                    {/* Content Card */}
                                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className={`font-bold text-sm ${v.editor.includes('IA') ? 'text-purple-600' : 'text-pink-600'}`}>{v.editor}</span>
                                            <span className="text-xs font-bold text-gray-400">{v.time}</span>
                                        </div>
                                        <p className="text-gray-800 font-bold text-sm">{v.action}</p>
                                        <p className="text-gray-500 text-xs mt-1">{v.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Sidebar Info (Right) */}
                <div className="flex flex-col gap-6">
                    {/* Cliente */}
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 relative overflow-hidden group">
                        <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-blue-400 to-indigo-500"></div>
                        <div className="p-6">
                            <h3 className="font-bold text-gray-400 mb-4 flex items-center gap-2 uppercase text-xs tracking-wider">
                                <User size={16} /> Contacto de Cliente
                            </h3>
                            <p className="text-2xl font-black text-gray-900 leading-tight mb-2">{folio.cliente_nombre}</p>
                            <div className="space-y-1">
                                <p className="text-gray-600 font-medium text-lg">{folio.cliente_telefono || 'Sin teléfono'}</p>
                                {folio.cliente_telefono_extra && <p className="text-gray-500 text-sm">{folio.cliente_telefono_extra}</p>}
                                {folio.client?.email && <p className="text-gray-500 text-sm break-all">{folio.client.email}</p>}
                            </div>
                        </div>
                    </div>

                    {/* Entrega */}
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 relative overflow-hidden">
                        <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-orange-400 to-red-500"></div>
                        <div className="p-6">
                            <h3 className="font-bold text-gray-400 mb-4 flex items-center gap-2 uppercase text-xs tracking-wider">
                                <Calendar size={16} /> Fecha de Entrega
                            </h3>
                            <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100 flex items-center justify-between">
                                <div className="text-center w-full">
                                    <p className="text-3xl font-black text-orange-600 tracking-tight">{folio.fecha_entrega}</p>
                                    <p className="text-orange-900 font-bold text-lg mt-1 block w-full text-center">⏰ {folio.hora_entrega} hrs</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Finanzas Totales */}
                    <div className="bg-gray-900 text-white rounded-3xl shadow-xl shadow-gray-300 relative overflow-hidden">
                        <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
                        <div className="p-6 z-10 relative">
                            <h3 className="font-bold text-gray-400 mb-4 flex items-center gap-2 uppercase text-xs tracking-wider">
                                <DollarSign size={16} /> Resumen Financiero
                            </h3>
                            
                            <div className="space-y-3 mb-6">
                                <div className="flex justify-between items-center text-sm font-medium">
                                    <span className="text-gray-400">Total Pedido</span>
                                    <span className="text-xl">$ {parseFloat(folio.total || 0).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm font-medium">
                                    <span className="text-gray-400">Anticipo / Pago</span>
                                    <span className="text-emerald-400 text-lg bg-emerald-900/40 px-2 py-0.5 rounded-md">- $ {parseFloat(folio.anticipo || 0).toFixed(2)}</span>
                                </div>
                            </div>
                            
                            <div className="border-t border-gray-700/80 pt-4">
                                <div className="flex justify-between items-end mb-4">
                                    <span className="text-gray-400 font-bold text-sm uppercase tracking-wider">Resta por Pagar</span>
                                    <span className="text-4xl font-black tracking-tighter text-white">
                                        <span className="text-2xl mr-1 opacity-50">$</span>
                                        {Math.max(0, (parseFloat(folio.total || 0) - parseFloat(folio.anticipo || 0))).toFixed(2)}
                                    </span>
                                </div>
                                
                                <div className={`w-full text-center py-3 rounded-xl font-bold tracking-widest uppercase transition-all
                                    ${folio.estatus_pago === 'Pagado' ? 'bg-emerald-500 shadow-lg shadow-emerald-900 text-white' : 'bg-yellow-500 text-yellow-950 shadow-lg shadow-yellow-900'}`}>
                                    {folio.estatus_pago || 'PENDIENTE'}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FolioDetailPage;