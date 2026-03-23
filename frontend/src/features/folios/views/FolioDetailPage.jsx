import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
// Asegúrate de que esta ruta sea la correcta en tu estructura de carpetas
import foliosApi, { downloadPdfBlob } from '@/features/folios/api/folios.api'; 
import { ArrowLeft, FileText, Calendar, User, DollarSign, Package, Edit, History } from 'lucide-react';
import toast from 'react-hot-toast';

const FolioDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [folio, setFolio] = useState(null);
    const [audits, setAudits] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // 🛡️ Evitamos peticiones a IDs basura
        if (!id || id === ':id' || id === 'undefined') return;

        const fetchFolio = async () => {
            try {
                const [data, auditsData] = await Promise.all([
                    foliosApi.getFolio(id),
                    foliosApi.getAudits(id).catch(e => {
                        console.error('Error fetching audits', e);
                        return [];
                    })
                ]);
                
                // Forzamos la actualización del estado
                setFolio(data.folio || data);
                
                // AJUSTE 1: Protegemos el setAudits para asegurar que siempre sea un Array
                const auditsArray = Array.isArray(auditsData) 
                    ? auditsData 
                    : (auditsData?.audits || auditsData?.data || []);
                setAudits(auditsArray);

            } catch (error) {
                console.error("❌ Error fetchFolio:", error);
                toast.error('No se pudo cargar la información del pedido');
                // navigate('/pedidos'); // Comenta esto temporalmente para ver el error
            } finally {
                setLoading(false);
            }
        };
        fetchFolio();
    }, [id]);

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
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
            <div className="w-16 h-16 border-4 border-pink-200 border-t-pink-500 rounded-full animate-spin"></div>
            <p className="text-gray-500 font-medium animate-pulse">Cargando detalles del pedido...</p>
        </div>
    );

    if (!folio) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 p-6">
            <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center text-red-400 mb-2">
                <Package size={48} />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Pedido no encontrado</h2>
            <p className="text-gray-500 text-center max-w-md">No pudimos cargar la información de este pedido. Puede que haya sido eliminado o no tengas acceso.</p>
            <button
                onClick={() => navigate('/pedidos')}
                className="mt-4 px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-black transition shadow-lg"
            >
                Regresar a Pedidos
            </button>
        </div>
    );

    return (
        <div className="p-6 max-w-5xl mx-auto animate-in fade-in duration-500">
            <button
                onClick={() => navigate('/pedidos')}
                className="flex items-center text-gray-500 hover:text-gray-800 mb-6 transition"
            >
                <ArrowLeft size={20} className="mr-2" />
                Volver a Pedidos
            </button>

            {/* Header Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                        Folio #{folio.folio_numero || folio.id}
                        <span className={`text-sm px-3 py-1 rounded-full ${
                            folio.estatus_folio === 'Cancelado' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-800'
                        }`}>
                            {folio.estatus_folio || 'Activo'}
                        </span>
                    </h1>
                    <p className="text-gray-500 mt-1">
                        Creado el {new Date(folio.createdAt).toLocaleDateString('es-MX', { 
                            year: 'numeric', month: 'long', day: 'numeric' 
                        })}
                    </p>
                </div>

                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => navigate(`/pedidos/${id}/editar`)}
                        className="flex items-center gap-2 bg-white border border-blue-200 text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-lg font-medium shadow-sm transition"
                    >
                        <Edit size={18} />
                        Editar
                    </button>
                    <button
                        onClick={handleOpenComanda}
                        className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg font-medium shadow-sm transition"
                    >
                        <FileText size={18} />
                        Descargar Comanda
                    </button>
                    <button
                        onClick={handleOpenNota}
                        className="flex items-center gap-2 bg-purple-600 text-white hover:bg-purple-700 px-4 py-2 rounded-lg font-medium shadow-md transition"
                    >
                        <DollarSign size={18} />
                        Descargar Nota
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Main Info */}
                <div className="md:col-span-2 space-y-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <Package size={20} className="text-pink-500" />
                            Detalles del Pedido Principal
                        </h2>
                        <div className="space-y-4">
                            <div className="p-4 bg-gray-50 rounded-xl">
                                <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">Descripción y Detalles</p>
                                <p className="text-gray-800 text-lg">{folio.descripcion_diseno || 'Sin descripción detallada'}</p>
                                {folio.dedicatoria && (
                                    <div className="mt-3 border-t border-gray-200 pt-3">
                                        <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">Dedicatoria Escrita</p>
                                        <p className="text-gray-800 italic">"{folio.dedicatoria}"</p>
                                    </div>
                                )}
                            </div>
                            
                            {/* Mostrar Sabores Generales SOLO si es un pastel Normal (1 piso) */}
                            {folio.tipo_folio !== 'Base' && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-500 font-semibold uppercase">Sabores de Pan</p>
                                        <p className="font-medium text-gray-800">
                                            {Array.isArray(folio.sabores_pan) ? folio.sabores_pan.join(', ') : folio.sabores_pan || 'N/A'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500 font-semibold uppercase">Rellenos</p>
                                        <p className="font-medium text-gray-800">
                                            {Array.isArray(folio.rellenos) ? folio.rellenos.join(', ') : folio.rellenos || 'N/A'}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* SECCIÓN DINÁMICA: PISOS (Solo si el tipo es Base o si hay detallesPisos) */}
                    {(folio.tipo_folio === 'Base' || (folio.detallesPisos && folio.detallesPisos.length > 0)) && (
                        <div className="bg-purple-50 rounded-2xl shadow-sm border border-purple-100 p-6">
                            <h2 className="text-lg font-bold text-purple-900 mb-4">Estructura por Pisos</h2>
                            <div className="space-y-3">
                                {(typeof folio.detallesPisos === 'string' ? JSON.parse(folio.detallesPisos) : (folio.detallesPisos || folio.diseno_metadata?.pisos || [])).map((piso, index) => (
                                    <div key={index} className="bg-white p-4 rounded-xl border border-purple-100 shadow-sm">
                                        <div className="flex justify-between items-center mb-2 border-b border-purple-50 pb-2">
                                            <span className="font-bold text-purple-800">Piso {index + 1}</span>
                                            <span className="text-sm bg-purple-100 text-purple-700 px-2 py-1 rounded-md font-medium">
                                                {piso.personas || piso.persons} pax
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 text-sm">
                                            <div><span className="text-gray-500">Pan:</span> <span className="font-medium">{Array.isArray(piso.panes || piso.flavor) ? (piso.panes || piso.flavor).join(', ') : (piso.panes || piso.flavor)}</span></div>
                                            <div><span className="text-gray-500">Relleno:</span> <span className="font-medium">{Array.isArray(piso.rellenos || piso.filling) ? (piso.rellenos || piso.filling).join(', ') : (piso.rellenos || piso.filling)}</span></div>
                                            {piso.notas && <div className="col-span-2 mt-1"><span className="text-gray-500">Notas:</span> <span className="italic text-gray-700">{piso.notas}</span></div>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* SECCIÓN DINÁMICA: COMPLEMENTARIOS */}
                    {(() => {
                        // Unificamos las fuentes posibles igual que en el Context
                        let rawComps = folio.complementosList || folio.complementarios || folio.complementos || [];
                        try { if (typeof rawComps === 'string') rawComps = JSON.parse(rawComps); } catch(e) {}
                        const compsArray = Array.isArray(rawComps) ? rawComps : [];

                        if (compsArray.length === 0) return null;

                        return (
                            <div className="bg-blue-50 rounded-2xl shadow-sm border border-blue-100 p-6">
                                <h2 className="text-lg font-bold text-blue-900 mb-4 flex items-center gap-2">
                                    Pasteles Complementarios
                                    <span className="bg-blue-200 text-blue-800 text-xs px-2 py-1 rounded-full">{compsArray.length}</span>
                                </h2>
                                <div className="space-y-3">
                                    {compsArray.map((comp, index) => (
                                        <div key={index} className="bg-white p-4 rounded-xl border border-blue-100 shadow-sm flex flex-col md:flex-row gap-4 justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-bold text-gray-800">{comp.forma || comp.shape || 'N/A'}</span>
                                                    <span className="text-xs text-gray-500 border border-gray-200 px-2 rounded-full">{comp.personas || comp.persons || 0} pax</span>
                                                </div>
                                                <p className="text-sm text-gray-600">
                                                    <span className="font-semibold">Pan:</span> {comp.sabor || comp.sabor_pan || comp.flavor || 'N/A'} | <span className="font-semibold">Relleno:</span> {comp.relleno || comp.filling || 'N/A'}
                                                </p>
                                                {(comp.descripcion || comp.description) && (
                                                    <p className="text-sm text-gray-500 italic mt-1">"{comp.descripcion || comp.description}"</p>
                                                )}
                                            </div>
                                            <div className="text-right font-bold text-blue-700 bg-blue-50 px-3 py-2 rounded-lg self-start">
                                                ${parseFloat(comp.precio || comp.price || 0).toFixed(2)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })()}
                </div>

                {/* Sidebar Info */}
                <div className="space-y-6">
                    {/* Cliente */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2 uppercase text-xs tracking-wider">
                            <User size={18} /> Cliente
                        </h3>
                        <p className="text-xl font-bold text-gray-900">{folio.cliente_nombre}</p>
                        <p className="text-gray-600 font-medium">{folio.cliente_telefono || 'Sin teléfono'}</p>
                        {folio.client?.email && <p className="text-gray-500 text-sm mt-1">{folio.client.email}</p>}
                    </div>

                    {/* Entrega */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2 uppercase text-xs tracking-wider">
                            <Calendar size={18} /> Entrega
                        </h3>
                        <p className="text-lg font-bold text-gray-900">{folio.fecha_entrega}</p>
                        <p className="text-gray-600 font-medium">Hora: {folio.hora_entrega} hrs</p>
                    </div>

                    {/* Totales */}
                    <div className="bg-gray-900 text-white rounded-2xl shadow-lg p-6">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-gray-400 font-medium">Total</span>
                            <span className="text-2xl font-bold">$ {parseFloat(folio.total || 0).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center mb-4 text-sm">
                            <span className="text-gray-400 font-medium">Anticipo</span>
                            <span className="text-green-400 font-bold">- $ {parseFloat(folio.anticipo || 0).toFixed(2)}</span>
                        </div>
                        <div className="border-t border-gray-700 pt-3 flex justify-between items-center font-bold">
                            <span className="text-gray-200">Resta por Pagar</span>
                            <span className="text-xl text-pink-400">
                                $ {(parseFloat(folio.total || 0) - parseFloat(folio.anticipo || 0)).toFixed(2)}
                            </span>
                        </div>
                        <div className={`mt-4 text-center py-2 rounded-lg font-black text-xs tracking-widest ${
                            folio.estatus_pago === 'Pagado' ? 'bg-green-600' : 'bg-yellow-600 text-yellow-950'
                        }`}>
                            {folio.estatus_pago?.toUpperCase() || 'PENDIENTE'}
                        </div>
                    </div>

                    {/* Historial de Edición */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2 uppercase text-xs tracking-wider">
                            <History size={18} /> Historial de Cambios
                        </h3>
                        
                        {/* AJUSTE 2: Protegemos el render con Array.isArray() */}
                        {!Array.isArray(audits) || audits.length === 0 ? (
                            <p className="text-gray-400 text-sm text-center py-4">No hay cambios registrados.</p>
                        ) : (
                            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                                {audits.map((audit) => (
                                    <div key={audit.id} className="relative pl-4 border-l-2 border-gray-100 pb-2 last:pb-0">
                                        <div className="absolute -left-[5px] top-1 w-2 h-2 rounded-full bg-pink-400"></div>
                                        <div className="text-xs font-bold text-gray-800 flex justify-between">
                                            <span>
                                                {audit.action === 'CREATE' ? 'Creado' : audit.action === 'UPDATE' ? 'Actualizado' : audit.action}
                                            </span>
                                            <span className="text-gray-400 font-normal">{new Date(audit.createdAt).toLocaleString('es-MX', {day:'numeric', month:'short', hour:'2-digit', minute:'2-digit'})}</span>
                                        </div>
                                        <div className="text-sm text-gray-600 mt-1">
                                            Por: <span className="font-medium text-gray-800">{audit.actor?.name || 'Sistema'}</span>
                                        </div>
                                        {audit.meta?.changes && Object.keys(audit.meta.changes).length > 0 && (
                                            <div className="mt-2 bg-gray-50 text-[10px] p-2 rounded border border-gray-100 space-y-1">
                                                {Object.keys(audit.meta.changes).map(key => {
                                                    let from = audit.meta.changes[key].from;
                                                    let to = audit.meta.changes[key].to;
                                                    if (typeof from === 'object') from = JSON.stringify(from);
                                                    if (typeof to === 'object') to = JSON.stringify(to);
                                                    return (
                                                        <div key={key}>
                                                            <span className="font-bold text-gray-700 mr-1">{key}:</span>
                                                            <span className="text-gray-400 line-through">{from || 'vacío'}</span>
                                                            <span className="text-green-600 ml-1">➔ {to || 'vacío'}</span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FolioDetailPage;