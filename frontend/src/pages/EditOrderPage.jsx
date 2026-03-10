import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import foliosApi from '@/features/folios/api/folios.api';
import { useOrder } from '@/context/OrderContext';
import { Loader2, ArrowLeft } from 'lucide-react';
import NewFolioWizard from '@/features/folios/views/NewFolioWizard';
import toast from 'react-hot-toast';

const EditOrderPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { loadOrder, resetOrder } = useOrder();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                setLoading(true);
                const data = await foliosApi.getFolio(id);
                loadOrder(data);
                setError(null);
            } catch (err) {
                console.error("Error fetching order:", err);
                setError("No se pudo cargar la información del pedido.");
                toast.error("Error al cargar pedido");
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchOrder();
        }

        // Cleanup on unmount handled by context reset if needed, 
        // but here we might want to reset order when leaving this page 
        // to not pollute the "new" wizard later.
        return () => {
            // resetOrder(); 
        };
    }, [id]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                <Loader2 className="animate-spin text-pink-500" size={48} />
                <p className="text-gray-500 font-medium">Cargando pedido para editar...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
                <p className="text-red-500 font-bold text-xl mb-4">{error}</p>
                <button
                    onClick={() => navigate('/pedidos')}
                    className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-black transition"
                >
                    Volver a Pedidos
                </button>
            </div>
        );
    }

    return (
        <div className="animate-in fade-in duration-500">
            <header className="mb-6 flex items-center justify-between">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center text-gray-500 hover:text-gray-800 transition"
                >
                    <ArrowLeft size={20} className="mr-2" />
                    Cancelar Edición
                </button>
                <h1 className="text-xl font-bold text-gray-800">Editando Pedido #{id}</h1>
                <div className="w-20"></div> {/* Spacer */}
            </header>
            
            <NewFolioWizard />
        </div>
    );
};

export default EditOrderPage;
