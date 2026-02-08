import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import OrderCard from '../../components/OrderCard';
import foliosApi from '../../services/folios';
import { Plus } from 'lucide-react';
import toast from 'react-hot-toast';

const FoliosPage = () => {
    const [folios, setFolios] = useState([]);
    const [loading, setLoading] = useState(true);
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

    // Mapper to match OrderCard expected props if needed.
    // OrderCard expects "order" prop with fields:
    // id, folio_numero, estatus_folio, estatus_produccion, cliente_nombre, descripcion_diseno, fecha_entrega, hora_entrega, estatus_pago
    // The API seems to return snake_case fields which OrderCard already uses.
    // So we can pass the folio object directly.

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Mis Pedidos</h1>
                    <p className="text-gray-500">Gestiona y da seguimiento a tus órdenes</p>
                </div>
                <button
                    onClick={() => navigate('/pedidos/nuevo')}
                    className="bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors font-medium shadow-sm"
                >
                    <Plus size={20} />
                    Nuevo Pedido
                </button>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-64 bg-gray-100 rounded-2xl animate-pulse"></div>
                    ))}
                </div>
            ) : folios.length === 0 ? (
                <div className="text-center py-20 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
                    <p className="text-gray-400 text-lg">No hay pedidos registrados aún.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {folios.map(folio => (
                        <div key={folio.id} onClick={() => navigate(`/folios/${folio.id}`)} className="cursor-pointer block h-full">
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
