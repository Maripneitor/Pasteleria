import React, { useState } from 'react';
import { useOrder } from '../../../context/OrderContext';
import ClientAutocomplete from '../wizard/ClientAutocomplete';
import { User, Phone } from 'lucide-react';

const StepA_Client = ({ next, prev }) => {
    const { orderData, updateOrder } = useOrder();
    const [isAnonymous, setIsAnonymous] = useState(!orderData.selectedClient && !!orderData.clientName);

    const handleAnonymousToggle = (e) => {
        const checked = e.target.checked;
        setIsAnonymous(checked);
        if (checked) {
            updateOrder({ selectedClient: null });
        } else {
            updateOrder({ clientName: '', clientPhone: '' }); // Clear manual if switching back
        }
    };

    const isValid = orderData.clientName && orderData.clientPhone;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <span className="bg-pink-100 text-pink-600 w-8 h-8 rounded-full flex items-center justify-center text-sm">A</span>
                Datos del Cliente
            </h2>

            {/* Toggle Anonymous */}
            <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-xl border border-gray-100">
                <input
                    type="checkbox"
                    id="anon-toggle"
                    checked={isAnonymous}
                    onChange={handleAnonymousToggle}
                    className="w-5 h-5 text-pink-600 rounded focus:ring-pink-500 border-gray-300"
                />
                <label htmlFor="anon-toggle" className="text-gray-700 font-medium cursor-pointer select-none">
                    Cliente Ocasional / Anónimo (Sin registro)
                </label>
            </div>

            {isAnonymous ? (
                // Manual Fields
                <div className="grid md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Cliente *</label>
                        <div className="relative">
                            <User className="absolute left-3 top-3 text-gray-400" size={18} />
                            <input
                                type="text"
                                value={orderData.clientName || ''}
                                onChange={(e) => updateOrder({ clientName: e.target.value })}
                                placeholder="Ej. Juan Pérez"
                                className="w-full pl-10 p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 outline-none"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono Principal *</label>
                        <div className="relative">
                            <Phone className="absolute left-3 top-3 text-gray-400" size={18} />
                            <input
                                type="tel"
                                value={orderData.clientPhone || ''}
                                onChange={(e) => updateOrder({ clientPhone: e.target.value })}
                                placeholder="Ej. 55 1234 5678"
                                className="w-full pl-10 p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 outline-none"
                            />
                        </div>
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono Adicional (Opcional)</label>
                        <input
                            type="tel"
                            value={orderData.clientPhoneExtra || ''}
                            onChange={(e) => updateOrder({ clientPhoneExtra: e.target.value })}
                            placeholder="Otro número de contacto"
                            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 outline-none"
                        />
                    </div>
                </div>
            ) : (
                // Autocomplete
                <div>
                    <ClientAutocomplete
                        selectedClient={orderData.selectedClient}
                        onSelect={(client) => {
                            if (client) {
                                updateOrder({
                                    selectedClient: client,
                                    clientName: client.name,
                                    clientPhone: client.phone
                                });
                            } else {
                                updateOrder({ selectedClient: null, clientName: '', clientPhone: '' });
                            }
                        }}
                    />
                    {orderData.selectedClient && (
                        <div className="mt-4 p-4 bg-green-50 border border-green-100 rounded-xl flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold">
                                {orderData.clientName.charAt(0)}
                            </div>
                            <div>
                                <p className="font-bold text-gray-800">{orderData.clientName}</p>
                                <p className="text-sm text-gray-600">{orderData.clientPhone}</p>
                                <span className="text-xs bg-green-200 text-green-800 px-2 py-0.5 rounded-full">Registrado</span>
                            </div>
                        </div>
                    )}
                </div>
            )}

            <div className="flex justify-end pt-4">
                <button
                    onClick={next}
                    disabled={!isValid}
                    className="bg-pink-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg shadow-pink-200"
                >
                    Siguiente (Detalles) arrow_forward
                </button>
            </div>
        </div>
    );
};

export default StepA_Client;
