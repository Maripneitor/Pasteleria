import React, { useState } from 'react';
import { useOrder } from '../../context/OrderContext';
import { DollarSign, CheckCircle } from 'lucide-react';
import { createOrder } from '../../services/ordersApi';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const StepPayment = () => {
    const { orderData, updateOrder, prevStep } = useOrder();
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        updateOrder({ [e.target.name]: parseFloat(e.target.value) || 0 });
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const product = orderData.products?.[0] || {};

            // Construir payload que coincida con folioController.js
            // Construir payload V3 Robust Spec (Spanish Keys)
            const payload = {
                // Mapeo directo a modelo en español
                cliente_nombre: orderData.clientName,
                cliente_telefono: orderData.clientPhone,
                cliente_telefono_extra: orderData.clientPhone2 || '',

                fecha_entrega: orderData.deliveryDate,
                hora_entrega: orderData.deliveryTime,

                tipo_folio: product.type || 'Normal',

                // Arrays
                sabores_pan: product.flavorId ? [product.flavorName] : [],
                rellenos: product.fillingId ? [product.fillingName] : [],

                numero_personas: product.persons || 10,
                forma: product.shape || 'Redondo',

                descripcion_diseno: product.design || '',

                // Metadatos y Extras
                diseno_metadata: {
                    dedicatoria: product.dedication || '',
                    entrega: {
                        isDelivery: orderData.isDelivery,
                        location: orderData.deliveryLocation || 'En Sucursal'
                    }
                },
                ubicacion_entrega: orderData.deliveryLocation || 'En Sucursal',

                // Económicos
                total: orderData.total || 0,
                anticipo: orderData.advance || 0,

                estatus_pago: (orderData.total - orderData.advance) <= 0 ? 'Pagado' : 'Pendiente',
                estatus_produccion: 'Pendiente',

                // Prefijo para generador
                folio_numero: null // Dejar que backend genere
            };

            await createOrder(payload);

            // 🔥 Avisar a toda la app que cambió la data
            window.dispatchEvent(new Event('folios:changed'));

            toast.success('¡Pedido Creado Exitosamente!');
            navigate('/pedidos');
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Error al crear pedido');
        } finally {
            setLoading(false);
        }
    };

    const remaining = (orderData.total || 0) - (orderData.advance || 0);

    return (
        <div className="space-y-6 fade-in">
            <h2 className="text-2xl font-bold text-gray-800">Pago y Confirmación</h2>

            <div className="grid md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Total del Pedido</label>
                    <div className="relative">
                        <DollarSign className="absolute left-3 top-3.5 text-gray-500" size={20} />
                        <input
                            type="number"
                            name="total"
                            value={orderData.total || ''} // Si es 0 o null, muestra vacío para facilitar edición
                            onChange={(e) => updateOrder({ [e.target.name]: e.target.value === '' ? 0 : parseFloat(e.target.value) })}
                            placeholder="0.00"
                            className="w-full pl-10 p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none text-lg font-bold text-gray-800"
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Anticipo</label>
                    <div className="relative">
                        <DollarSign className="absolute left-3 top-3.5 text-gray-500" size={20} />
                        <input
                            type="number"
                            name="advance"
                            value={orderData.advance || ''} // Si es 0 o null, muestra vacío
                            onChange={(e) => updateOrder({ [e.target.name]: e.target.value === '' ? 0 : parseFloat(e.target.value) })}
                            placeholder="0.00"
                            className="w-full pl-10 p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-lg font-bold text-blue-600"
                        />
                    </div>
                </div>
            </div>

            <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-2xl border border-gray-200">
                <h3 className="font-bold text-gray-600 mb-4">Resumen</h3>
                <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                        <span>Cliente:</span>
                        <span className="font-medium">{orderData.clientName}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Entrega:</span>
                        <span className="font-medium">{orderData.deliveryDate} {orderData.deliveryTime}</span>
                    </div>
                    <div className="flex justify-between border-t border-gray-300 pt-2 mt-2">
                        <span className="text-xl font-bold text-gray-800">Resta:</span>
                        <span className={`text-xl font-bold ${remaining > 0 ? 'text-red-500' : 'text-green-600'}`}>
                            ${remaining.toFixed(2)}
                        </span>
                    </div>
                </div>
            </div>

            <div className="flex justify-between pt-4">
                <button onClick={prevStep} className="px-6 py-3 text-gray-600 font-medium hover:bg-gray-100 rounded-xl">
                    Atrás
                </button>
                <button
                    onClick={handleSubmit}
                    disabled={loading || orderData.total <= 0}
                    className="bg-green-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-green-700 disabled:opacity-50 transition shadow-lg shadow-green-200 flex items-center gap-2"
                >
                    {loading ? 'Guardando...' : <><CheckCircle size={20} /> Finalizar Pedido</>}
                </button>
            </div>
        </div>
    );
};

export default StepPayment;
