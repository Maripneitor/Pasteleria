import { useState } from 'react';
import OrderCard from '../components/OrderCard';
import { MOCK_ORDERS } from '../config/mockData';
import { PackageOpen } from 'lucide-react';

const OrdersPage = () => {
    // Usamos MOCK_ORDERS directamente para la demo
    const [orders] = useState(MOCK_ORDERS);

    if (orders.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-gray-400">
                <PackageOpen size={64} className="mb-4 text-pink-300" />
                <h3 className="text-xl font-bold text-gray-600">No hay pedidos aún</h3>
                <p>Comienza creando uno nuevo desde el botón superior.</p>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-gray-800">Gestión de Pedidos</h2>
                    <p className="text-gray-500">Vista general de todas las órdenes activas</p>
                </div>
                <button className="bg-gradient-to-r from-pink-500 to-pink-600 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-pink-500/30 hover:scale-[1.02] transition">
                    + Nuevo Pedido
                </button>
            </header>

            {/* Responsive Grid Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {orders.map(order => (
                    <OrderCard key={order.id} order={order} />
                ))}
            </div>
        </div>
    );
};

export default OrdersPage;
