import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import OrderCard from '@/components/OrderCard';
import foliosApi from '@/features/folios/api/folios.api';
import { Plus } from 'lucide-react';
import toast from 'react-hot-toast';

const FoliosPage = () => {
    const [folios, setFolios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, today, week
    const navigate = useNavigate();

    const fetchFolios = async () => {
        setLoading(true);
        try {
            const data = await foliosApi.listFolios();
            setFolios(data);
        } catch (error) {
            console.error(error);
            toast.error('Error al cargar pedidos');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFolios();
    }, []);

    // Helper para filtro visual
    const getFilteredFolios = () => {
        if (filter === 'all') return folios;
        const today = new Date().toISOString().split('T')[0];
        
        return folios.filter(folio => {
            if (!folio.fecha_entrega) return false;
            if (filter === 'today') {
                return folio.fecha_entrega === today;
            }
            if (filter === 'week') {
                // Lógica simple para "esta semana" (últimos 7 días o próximos 7 días)
                // Para simplificar el visual, mostramos todos por ahora o filtramos con JS nativo.
                const fDate = new Date(folio.fecha_entrega);
                const tDate = new Date();
                const diffTime = Math.abs(tDate - fDate);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
                return diffDays <= 7;
            }
            return true;
        });
    };

    const displayFolios = getFilteredFolios();

    return (
        <div className="p-4 sm:p-6 lg:max-w-7xl mx-auto animate-in fade-in pb-20">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Ventas y Pedidos</h1>
                    <p className="text-gray-500 font-medium mt-1">Gestiona, filtra y da seguimiento a todas tus órdenes</p>
                </div>
                <button
                    onClick={() => navigate('/pedidos/nuevo')}
                    className="w-full sm:w-auto bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white px-6 py-3 rounded-xl flex items-center justify-center gap-2 transition-all font-bold shadow-md hover:shadow-pink-200 hover:scale-[1.02]"
                >
                    <Plus size={20} />
                    Nuevo Pedido
                </button>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                <div className="bg-gray-100 p-1.5 rounded-2xl flex w-full sm:w-auto">
                    {[ 
                        { id: 'all', label: 'Todos' },
                        { id: 'today', label: 'Para Hoy' },
                        { id: 'week', label: 'Esta Semana' }
                    ].map(f => (
                        <button
                            key={f.id}
                            onClick={() => setFilter(f.id)}
                            className={`flex-1 sm:flex-none px-5 py-2 rounded-xl text-sm font-bold transition-all ${
                                filter === f.id 
                                ? 'bg-white text-pink-600 shadow-sm border border-gray-200/50' 
                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
                            }`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
                
                <div className="text-gray-400 font-medium text-sm flex items-center gap-2">
                    <ListFilter size={16} /> Mostrando {displayFolios.length} pedido(s)
                </div>
            </div>

            {/* Grid */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="h-48 bg-gray-100 border border-gray-200 rounded-3xl animate-pulse"></div>
                    ))}
                </div>
            ) : displayFolios.length === 0 ? (
                <div className="text-center py-24 bg-white rounded-3xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center">
                    <div className="bg-pink-50 p-4 rounded-full mb-4">
                        <CalendarIcon size={40} className="text-pink-300" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-1">No hay pedidos</h3>
                    <p className="text-gray-500 font-medium">No se encontraron órdenes para este filtro.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {displayFolios.map(folio => (
                        <div key={folio.id} onClick={() => navigate(`/folios/${folio.id}`)} className="cursor-pointer block h-full transform transition duration-300 hover:-translate-y-1">
                            <OrderCard
                                order={folio}
                                onUpdate={fetchFolios}
                            />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default FoliosPage;
