import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
// Asegúrate de que esta ruta sea la correcta en tu estructura de carpetas
import foliosApi, { downloadPdfBlob } from '@/features/folios/api/folios.api'; 
import { ArrowLeft, FileText, Calendar, User, DollarSign, Package } from 'lucide-react';
import toast from 'react-hot-toast';

const FolioDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [folio, setFolio] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // 🛡️ Evitamos peticiones a IDs basura
        if (!id || id === ':id' || id === 'undefined') return;

        const fetchFolio = async () => {
            try {
                console.log("🛰️ Trayendo datos para ID:", id);
                const data = await foliosApi.getFolio(id);
                console.log("📦 Datos recibidos del server:", data);
                
                // Forzamos la actualización del estado
                setFolio(data.folio || data);
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

    if (loading) return <div className="p-10 text-center">Cargando detalles del pedido...</div>;
    if (!folio) return null;

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

                <div className="flex gap-3">
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
                            Detalles del Pedido
                        </h2>
                        <div className="space-y-4">
                            <div className="p-4 bg-gray-50 rounded-xl">
                                <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">Descripción de Diseño</p>
                                <p className="text-gray-800 text-lg">{folio.descripcion_diseno || 'Sin descripción detallada'}</p>
                            </div>
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
                        </div>
                    </div>
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
                </div>
            </div>
        </div>
    );
};

export default FolioDetailPage;