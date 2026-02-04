import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import client from '../config/axios';
import EditOrderModal from '../components/orders/EditOrderModal';
import { Loader2 } from 'lucide-react';

const EditOrderPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                // Obtener datos del pedido
                const response = await client.get(`/folios/${id}`);
                setOrder(response.data);
            } catch (err) {
                console.error("Error fetching order:", err);
                setError("No se pudo cargar la información del pedido.");
            } finally {
                setLoading(false);
            }
        };

        if (id && id !== 'undefined' && id !== 'null') {
            fetchOrder();
        } else {
            console.warn("Invalid ID in EditOrderPage:", id);
            setError("ID de pedido no válido.");
            setLoading(false);
        }
    }, [id]);

    const handleClose = () => {
        // Al cerrar o guardar, volvemos a la vista anterior (idealmente Calendario)
        navigate('/calendario');
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-transparent">
                <Loader2 className="animate-spin text-pink-600" size={48} />
            </div>
        );
    }

    if (error) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                <div className="bg-white p-6 rounded-lg shadow-xl text-center space-y-4 max-w-sm w-full">
                    <p className="text-red-500 font-medium text-lg">{error}</p>
                    <button
                        onClick={handleClose}
                        className="px-4 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 transition w-full"
                    >
                        Volver
                    </button>
                </div>
            </div>
        );
    }

    return (
        <EditOrderModal
            isOpen={true} // Siempre abierto ya que estamos en su propia ruta
            order={order}
            onClose={handleClose}
            onUpdate={handleClose}
        />
    );
};

export default EditOrderPage;
