import React from 'react';
import { useOrder } from '../../context/OrderContext';
import { Calendar, Clock, MapPin } from 'lucide-react';

const StepDetails = () => {
    const { orderData, updateOrder, nextStep, prevStep } = useOrder();

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        updateOrder({ [name]: type === 'checkbox' ? checked : value });
    };

    const isValid = orderData.deliveryDate && orderData.deliveryTime &&
        (!orderData.isDelivery || (orderData.isDelivery && orderData.calle && orderData.colonia));

    return (
        <div className="space-y-6 fade-in">
            <h2 className="text-2xl font-bold text-gray-800">Fecha y Entrega</h2>

            <div className="grid md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Fecha de Entrega</label>
                    <div className="relative">
                        <Calendar className="absolute left-3 top-3.5 text-gray-400" size={20} />
                        <input
                            type="date"
                            name="deliveryDate"
                            value={orderData.deliveryDate}
                            onChange={handleChange}
                            className="w-full pl-10 p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 outline-none"
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Hora de Entrega</label>
                    <div className="relative">
                        <Clock className="absolute left-3 top-3.5 text-gray-400" size={20} />
                        <input
                            type="time"
                            name="deliveryTime"
                            value={orderData.deliveryTime}
                            onChange={handleChange}
                            className="w-full pl-10 p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 outline-none"
                        />
                    </div>
                </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-xl space-y-4">
                <label className="flex items-center gap-3 cursor-pointer">
                    <input
                        type="checkbox"
                        name="isDelivery"
                        checked={orderData.isDelivery}
                        onChange={handleChange}
                        className="w-5 h-5 text-pink-600 rounded focus:ring-pink-500"
                    />
                    <span className="font-medium text-gray-700">¿Requiere Domicilio?</span>
                </label>

                {orderData.isDelivery && (
                    <div className="space-y-3 animate-in slide-in-from-top-2 pt-2 border-t border-gray-200">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <input
                                type="text"
                                name="calle"
                                value={orderData.calle || ''}
                                onChange={handleChange}
                                placeholder="Calle y Número"
                                className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 outline-none bg-white"
                            />
                            <input
                                type="text"
                                name="colonia"
                                value={orderData.colonia || ''}
                                onChange={handleChange}
                                placeholder="Colonia"
                                className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 outline-none bg-white"
                            />
                        </div>
                        <textarea
                            name="referencias"
                            value={orderData.referencias || ''}
                            onChange={handleChange}
                            placeholder="Referencias (Color de casa, portón, entre calles...)"
                            className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 outline-none bg-white h-20 resize-none"
                        />

                        <div className="flex items-center gap-3 bg-blue-50 p-3 rounded-xl border border-blue-100">
                            <span className="text-blue-700 font-semibold text-sm">Costo de Envío:</span>
                            <div className="relative w-32">
                                <span className="absolute left-3 top-2 text-blue-500 font-bold">$</span>
                                <input
                                    type="number"
                                    name="shippingCost"
                                    value={orderData.shippingCost || 0}
                                    onChange={handleChange}
                                    className="w-full pl-6 p-2 border border-blue-200 rounded-lg focus:outline-none focus:border-blue-400 font-bold text-gray-700"
                                />
                            </div>
                        </div>

                        {orderData.calle && orderData.colonia && (
                            <a
                                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${orderData.calle}, ${orderData.colonia}`)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mt-2 text-sm font-medium"
                            >
                                <MapPin size={18} /> Ver ubicación en Google Maps
                            </a>
                        )}
                    </div>
                )}
            </div>

            <div className="flex justify-between pt-4">
                <button onClick={prevStep} className="px-6 py-3 text-gray-600 font-medium hover:bg-gray-100 rounded-xl">
                    Atrás
                </button>
                <button
                    onClick={nextStep}
                    disabled={!isValid}
                    className="bg-pink-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg shadow-pink-200"
                >
                    Siguiente
                </button>
            </div>
        </div>
    );
};

export default StepDetails;
