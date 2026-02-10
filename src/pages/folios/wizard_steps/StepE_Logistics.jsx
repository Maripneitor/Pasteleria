import React from 'react';
import { useOrder } from '../../../context/OrderContext';
import { MapPin, Truck, Store } from 'lucide-react';

const StepE_Logistics = ({ next, prev }) => {
    const { orderData, updateOrder } = useOrder();

    const isDelivery = orderData.is_delivery;

    const handleDeliveryToggle = (val) => {
        updateOrder({ is_delivery: val });
    };

    const isValid = !isDelivery || (orderData.calle && orderData.colonia); // Basic validation if delivery

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <span className="bg-pink-100 text-pink-600 w-8 h-8 rounded-full flex items-center justify-center text-sm">E</span>
                Logística de Entrega
            </h2>

            {/* Toggle Delivery vs Pickup */}
            <div className="grid grid-cols-2 gap-4">
                <button
                    onClick={() => handleDeliveryToggle(false)}
                    className={`p-6 rounded-2xl border-2 flex flex-col items-center gap-3 transition-all ${!isDelivery
                        ? 'border-pink-500 bg-pink-50 text-pink-700 shadow-md ring-2 ring-pink-200'
                        : 'border-gray-200 hover:border-pink-200 text-gray-500'}`}
                >
                    <Store size={32} />
                    <span className="font-bold">Recoger en Tienda</span>
                </button>
                <button
                    onClick={() => handleDeliveryToggle(true)}
                    className={`p-6 rounded-2xl border-2 flex flex-col items-center gap-3 transition-all ${isDelivery
                        ? 'border-pink-500 bg-pink-50 text-pink-700 shadow-md ring-2 ring-pink-200'
                        : 'border-gray-200 hover:border-pink-200 text-gray-500'}`}
                >
                    <Truck size={32} />
                    <span className="font-bold">Envío a Domicilio</span>
                </button>
            </div>

            {/* Address Fields (Only if Delivery) */}
            {isDelivery && (
                <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200 space-y-4 animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center gap-2 text-pink-600 font-bold mb-2">
                        <MapPin size={20} /> Dirección de Entrega
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Calle y Número *</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Calle principal"
                                    value={orderData.calle || ''}
                                    onChange={(e) => updateOrder({ calle: e.target.value })}
                                    className="flex-1 p-3 border border-gray-300 rounded-xl"
                                />
                                <input
                                    type="text"
                                    placeholder="Ext / Int"
                                    value={orderData.num_ext || ''}
                                    onChange={(e) => updateOrder({ num_ext: e.target.value })}
                                    className="w-24 p-3 border border-gray-300 rounded-xl"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Colonia / Asentamiento *</label>
                            <input
                                type="text"
                                value={orderData.colonia || ''}
                                onChange={(e) => updateOrder({ colonia: e.target.value })}
                                className="w-full p-3 border border-gray-300 rounded-xl"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Referencias</label>
                            <input
                                type="text"
                                value={orderData.referencias || ''}
                                onChange={(e) => updateOrder({ referencias: e.target.value })}
                                className="w-full p-3 border border-gray-300 rounded-xl"
                                placeholder="Entre calles, color de casa..."
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Link de Google Maps (Opcional)</label>
                            <input
                                type="text"
                                value={orderData.ubicacion_maps || ''}
                                onChange={(e) => updateOrder({ ubicacion_maps: e.target.value })}
                                className="w-full p-3 border border-gray-300 rounded-xl font-mono text-sm text-blue-600"
                                placeholder="https://maps.google.com/..."
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Delivery Cost */}
            {isDelivery && (
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Costo de Envío ($)</label>
                    <input
                        type="number"
                        value={orderData.costo_envio || 0}
                        onChange={(e) => updateOrder({ costo_envio: parseFloat(e.target.value) || 0 })}
                        className="w-full p-3 border border-gray-300 rounded-xl font-bold text-lg"
                    />
                </div>
            )}

            <div className="flex justify-between pt-6">
                <button onClick={prev} className="px-6 py-3 text-gray-600 font-bold hover:bg-gray-100 rounded-xl transition">Atrás</button>
                <button onClick={next} disabled={!isValid} className="bg-pink-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-pink-700 disabled:opacity-50 transition shadow-lg shadow-pink-200">Siguiente (Pago) arrow_forward</button>
            </div>
        </div>
    );
};

export default StepE_Logistics;
