import React from 'react';
import { useOrder } from '../../context/OrderContext';
import { User, Phone } from 'lucide-react';

const StepClient = () => {
    const { orderData, updateOrder, nextStep } = useOrder();

    const handleChange = (e) => {
        updateOrder({ [e.target.name]: e.target.value });
    };

    const isValid = orderData.clientName && orderData.clientPhone;

    return (
        <div className="space-y-6 fade-in">
            <h2 className="text-2xl font-bold text-gray-800">Datos del Cliente</h2>
            <div className="grid gap-6">
                <div className="relative">
                    <User className="absolute left-3 top-3.5 text-gray-400" size={20} />
                    <input
                        type="text"
                        name="clientName"
                        value={orderData.clientName}
                        onChange={handleChange}
                        placeholder="Nombre completo"
                        className="w-full pl-10 p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 outline-none"
                    />
                </div>
                <div className="relative">
                    <Phone className="absolute left-3 top-3.5 text-gray-400" size={20} />
                    <input
                        type="tel"
                        name="clientPhone"
                        value={orderData.clientPhone}
                        onChange={handleChange}
                        placeholder="Teléfono"
                        className="w-full pl-10 p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 outline-none"
                    />
                </div>
            </div>

            <div className="flex justify-end pt-4">
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

export default StepClient;
