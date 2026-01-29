import { useEffect, useState } from 'react';
import { ordersApi } from '../services/ordersApi';
import OrderCard from '../components/OrderCard';
import { PackageOpen, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function OrdersPage() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const fetchOrders = async () => {
        try {
            setLoading(true);
            // ordersApi.list now returns the response object, so we destructure data
            const { data } = await ordersApi.list();
            setOrders(Array.isArray(data) ? data : []);
        } catch (e) {
            console.error('Error fetching orders:', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchOrders(); }, []);

    if (loading) return (
        <div className="flex justify-center items-center h-[50vh] text-pink-500">
            <Loader2 className="animate-spin" size={48} />
        </div>
    );

    return (
        <div className="p-6 space-y-6">
            <header className="flex justify-between items-center">
                <h1 className="text-3xl font-bold flex items-center gap-2 text-gray-800">
                    <PackageOpen className="text-pink-600" /> Pedidos
                </h1>
                <button
                    onClick={() => navigate('/pedidos/nuevo')}
                    className="bg-pink-600 text-white px-5 py-2 rounded-xl font-bold hover:bg-pink-700 transition"
                >
                    + Nuevo Pedido
                </button>
            </header>

            {!orders.length ? (
                <div className="p-12 flex flex-col items-center text-center text-gray-400 bg-white rounded-2xl border border-dashed border-gray-200">
                    <PackageOpen className="w-16 h-16 mb-4 text-gray-200" />
                    <p className="text-lg font-medium">No hay pedidos todavÃ­a.</p>
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {orders.map((o) => (
                        <OrderCard key={o.id} order={o} onUpdate={fetchOrders} />
                    ))}
                </div>
            )}
        </div>
    );
}
