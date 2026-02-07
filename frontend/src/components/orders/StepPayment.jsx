import React, { useState } from 'react';
import { useOrder } from '../../context/OrderContext';
import { DollarSign, CheckCircle } from 'lucide-react';
import foliosApi from '../../services/folios';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const StepPayment = () => {
    const { orderData, updateOrder, prevStep } = useOrder();
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // handleChange removed (unused)

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

                // Arrays (Send IDs for backend resolution)
                flavorIds: product.flavorId ? [product.flavorId] : [],
                fillingIds: product.fillingId ? [product.fillingId] : [],

                // Legacy fields (Backend will populate these based on IDs)
                sabores_pan: [],
                rellenos: [],

                numero_personas: product.persons || 10,
                forma: product.shape || 'Redondo',

                descripcion_diseno: product.design || '',
                imagen_referencia_url: product.referenceImageUrl || null,

                // Metadatos y Extras
                diseno_metadata: {
                    dedicatoria: product.dedication || '',
                    entrega: {
                        isDelivery: orderData.isDelivery,
                        location: orderData.deliveryLocation || 'En Sucursal'
                    },
                    // Store technical IDs here if returned? No, we send them up.
                },
                ubicacion_entrega: orderData.deliveryLocation || 'En Sucursal',

                // Económicos
                total: orderData.total || 0,
                anticipo: orderData.advance || 0,

                estatus_pago: (orderData.total - orderData.advance) <= 0 ? 'Pagado' : 'Pendiente',
                estatus_produccion: 'Pendiente',

                // Commission Flag
                aplicar_comision_cliente: orderData.applyCommission || false,

                // Prefijo para generador
                folio_numero: null // Dejar que backend genere
            };

            const newFolio = await foliosApi.createFolio(payload);

            // 🔥 Avisar a toda la app que cambió la data
            window.dispatchEvent(new Event('folios:changed'));

            toast.success('¡Pedido Creado Exitosamente!');
            navigate(`/folios/${newFolio.id}`); // Navigate to the new detailed view logic
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

            {/* Commission Toggle Section */}
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                <div className="flex items-center gap-3">
                    <input
                        type="checkbox"
                        id="applyCommission"
                        checked={orderData.applyCommission || false}
                        onChange={(e) => updateOrder({ applyCommission: e.target.checked })}
                        className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
                    />
                    <label htmlFor="applyCommission" className="font-medium text-gray-700 cursor-pointer select-none">
                        Agregar comisión (5%) al cliente
                    </label>
                </div>

                {orderData.applyCommission && (
                    <div className="mt-3 pl-8 text-sm text-gray-600 space-y-1">
                        <div className="flex justify-between max-w-xs">
                            <span>Subtotal:</span>
                            <span>${(orderData.total || 0).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between max-w-xs font-medium text-blue-700">
                            <span>+ Comisión (5%):</span>
                            <span>${((orderData.total || 0) * 0.05).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between max-w-xs font-bold border-t border-blue-200 pt-1 mt-1">
                            <span>Total a Cobrar:</span>
                            <span>${((orderData.total || 0) * 1.05).toFixed(2)}</span>
                        </div>
                    </div>
                )}
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
