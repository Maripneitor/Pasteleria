import React, { useState } from 'react';
import { useOrder } from '@/context/OrderContext';
import ClientAutocomplete from '../wizard/ClientAutocomplete';
import { User, Phone, UserPlus } from 'lucide-react';
import CreateClientModal from '@/features/clients/components/CreateClientModal'; // 🔥 Importamos el Modal

const StepA_Client = ({ next, prev }) => {
    const { orderData, updateOrder } = useOrder();
    const [isRegistered, setIsRegistered] = useState(!!orderData.selectedClient);
    
    // 🔥 Estado para controlar el modal
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleRegisterToggle = (e) => {
        const checked = e.target.checked;
        setIsRegistered(checked);
        if (!checked) {
            updateOrder({ selectedClient: null });
        }
    };

    // 🔥 Callback mágico: Se dispara cuando el modal crea el cliente con éxito en BD
    const handleClientCreated = (newClient) => {
        // Autoseleccionamos al cliente en el contexto Global (El Carrito)
        updateOrder({
            selectedClient: newClient,
            clientName: newClient.name,
            clientPhone: newClient.phone,
            clientPhoneExtra: newClient.phone2 || newClient.cliente_telefono_extra || ''
        });
        // Nos aseguramos de estar en la vista de búsqueda/registro
        setIsRegistered(true);
    };

    // ✅ Verifica que tenga nombre y que el teléfono principal (limpio) tenga al menos 10 dígitos
    const cleanPhone = (orderData.clientPhone || '').replace(/\D/g, '');
    const isValid = orderData.clientName && cleanPhone.length >= 10 && cleanPhone.length <= 15;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <span className="bg-pink-100 text-pink-600 w-8 h-8 rounded-full flex items-center justify-center text-sm">A</span>
                Datos del Cliente
            </h2>

            {/* Toggle Registered */}
            <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-xl border border-gray-100">
                <input
                    type="checkbox"
                    id="register-toggle"
                    checked={isRegistered}
                    onChange={handleRegisterToggle}
                    className="w-5 h-5 text-pink-600 rounded focus:ring-pink-500 border-gray-300"
                />
                <label htmlFor="register-toggle" className="text-gray-700 font-medium cursor-pointer select-none">
                    Buscar / Registrar Cliente en Sistema (Opcional)
                </label>
            </div>

            {!isRegistered ? (
                // Manual Fields
                <div className="grid md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
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
                                placeholder="Ej. 961 123 4567"
                                className="w-full pl-10 p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 outline-none"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono Adicional (Opcional)</label>
                        <div className="relative">
                            <Phone className="absolute left-3 top-3 text-gray-400" size={18} />
                            <input
                                type="tel"
                                value={orderData.clientPhoneExtra || ''}
                                onChange={(e) => updateOrder({ clientPhoneExtra: e.target.value })}
                                placeholder="Ej. 961 987 6543"
                                className="w-full pl-10 p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 outline-none"
                            />
                        </div>
                    </div>
                </div>
            ) : (
                // Autocomplete & Create New Client Logic
                <div>
                    <ClientAutocomplete
                        selectedClient={orderData.selectedClient}
                        onSelect={(client) => {
                            if (client) {
                                updateOrder({
                                    selectedClient: client,
                                    clientName: client.name,
                                    clientPhone: client.phone,
                                    // 🔥 Extraemos el segundo teléfono si existe en la BD
                                    clientPhoneExtra: client.phone2 || client.cliente_telefono_extra || ''
                                });
                            } else {
                                updateOrder({ selectedClient: null, clientName: '', clientPhone: '', clientPhoneExtra: '' });
                            }
                        }}
                    />

                    {/* 🔥 BOTÓN PARA ABRIR MODAL (Se oculta si ya seleccionó a alguien) */}
                    {!orderData.selectedClient && (
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(true)}
                            className="mt-3 text-sm font-semibold text-pink-600 hover:text-pink-800 transition-colors flex items-center gap-1.5"
                        >
                            <UserPlus size={16} />
                            ¿No encuentras al cliente? Regístralo aquí
                        </button>
                    )}

                    {orderData.selectedClient && (
                        <div className="mt-4 p-4 bg-green-50 border border-green-100 rounded-xl flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold uppercase">
                                {orderData.clientName.charAt(0)}
                            </div>
                            <div>
                                <p className="font-bold text-gray-800">{orderData.clientName}</p>
                                <p className="text-sm text-gray-600">
                                    Principal: {orderData.clientPhone}
                                    {orderData.clientPhoneExtra && ` | Alt: ${orderData.clientPhoneExtra}`}
                                </p>
                                <span className="text-xs bg-green-200 text-green-800 px-2 py-0.5 rounded-full mt-1 inline-block">Registrado en Sistema</span>
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
                    Siguiente
                </button>
            </div>

            {/* 🔥 EL MODAL DE CREACIÓN */}
            <CreateClientModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onClientCreated={handleClientCreated}
            />
        </div>
    );
};

export default StepA_Client;