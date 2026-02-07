import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import OrderWizardLayout from '../../components/OrderWizardLayout';
import { useOrder } from '../../context/OrderContext';
import foliosApi from '../../services/folios';
import toast from 'react-hot-toast';

const NewFolioWizard = () => {
    const { step, setStep, orderData, updateOrder, nextStep, prevStep } = useOrder();
    const navigate = useNavigate();
    const [submitting, setSubmitting] = useState(false);

    // --- Steps Renderers ---

    // Step 1: Client
    const renderStep1 = () => (
        <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-700">Datos del Cliente</h2>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
                <input
                    type="text"
                    value={orderData.clientName}
                    onChange={(e) => updateOrder({ clientName: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 outline-none"
                    placeholder="Ej. Juan Pérez"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                <input
                    type="tel"
                    value={orderData.clientPhone}
                    onChange={(e) => updateOrder({ clientPhone: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 outline-none"
                    placeholder="Ej. 55 1234 5678"
                />
            </div>
            <div className="flex justify-end mt-6">
                <button
                    onClick={nextStep}
                    disabled={!orderData.clientName}
                    className="bg-pink-500 text-white px-6 py-2 rounded-lg hover:bg-pink-600 disabled:bg-gray-300 transition"
                >
                    Siguiente
                </button>
            </div>
        </div>
    );

    // Step 2: Products (Simplified for compatibility)
    const renderStep2 = () => (
        <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-700">Detalles del Pastel</h2>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sabor del Pan</label>
                <input
                    type="text"
                    value={orderData.flavorText || ''}
                    onChange={(e) => updateOrder({ flavorText: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                    placeholder="Ej. Vainilla, Chocolate..."
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Relleno</label>
                <input
                    type="text"
                    value={orderData.fillingText || ''}
                    onChange={(e) => updateOrder({ fillingText: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                    placeholder="Ej. Fresa, Ganache..."
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción / Diseño</label>
                <textarea
                    value={orderData.designDescription || ''}
                    onChange={(e) => updateOrder({ designDescription: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg h-24"
                    placeholder="Describa el diseño, colores, mensaje..."
                />
            </div>
            <div className="flex justify-between mt-6">
                <button onClick={prevStep} className="text-gray-500 hover:text-gray-700">Atrás</button>
                <button
                    onClick={nextStep}
                    className="bg-pink-500 text-white px-6 py-2 rounded-lg hover:bg-pink-600 transition"
                >
                    Siguiente
                </button>
            </div>
        </div>
    );

    // Step 3: Delivery
    const renderStep3 = () => (
        <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-700">Entrega</h2>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Entrega</label>
                    <input
                        type="date"
                        value={orderData.deliveryDate}
                        onChange={(e) => updateOrder({ deliveryDate: e.target.value })}
                        className="w-full p-2 border border-gray-300 rounded-lg"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Hora</label>
                    <input
                        type="time"
                        value={orderData.deliveryTime}
                        onChange={(e) => updateOrder({ deliveryTime: e.target.value })}
                        className="w-full p-2 border border-gray-300 rounded-lg"
                    />
                </div>
            </div>
            <div className="flex justify-between mt-6">
                <button onClick={prevStep} className="text-gray-500 hover:text-gray-700">Atrás</button>
                <button
                    onClick={nextStep}
                    disabled={!orderData.deliveryDate}
                    className="bg-pink-500 text-white px-6 py-2 rounded-lg hover:bg-pink-600 disabled:bg-gray-300 transition"
                >
                    Siguiente
                </button>
            </div>
        </div>
    );

    // Step 4: Summary & Submit
    const handleFinish = async () => {
        setSubmitting(true);
        try {
            // Build Payload
            const payload = {
                clientName: orderData.clientName,
                clientPhone: orderData.clientPhone, // If backend supports it
                fecha_entrega: orderData.deliveryDate,
                hora_entrega: orderData.deliveryTime,
                descripcion_diseno: orderData.designDescription,

                // Compatibility Fallback for Catalogs
                sabores_pan: JSON.stringify([orderData.flavorText || 'Estándar']),
                rellenos: JSON.stringify([orderData.fillingText || 'Estándar']),

                // Hardcoded IDs if required by backend constraints (assuming 1 exists or is default)
                // For now, sending text in JSON fields as established in legacy support strategy.

                total: parseFloat(orderData.total || 0),
                anticipo: parseFloat(orderData.advance || 0),
                status: 'PENDING'
            };

            const newFolio = await foliosApi.createFolio(payload);
            toast.success('Pedido creado con éxito');
            navigate(`/folios/${newFolio.id}`);

            // Should clear context? 
            // setOrderData(initialState) -> ideally done in context
        } catch (error) {
            console.error(error);
            toast.error('Error al crear el pedido');
        } finally {
            setSubmitting(false);
        }
    };

    const renderStep4 = () => (
        <div className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-700">Resumen y Pago</h2>

            <div className="bg-gray-50 p-4 rounded-lg text-sm space-y-2">
                <p><strong>Cliente:</strong> {orderData.clientName}</p>
                <p><strong>Entrega:</strong> {orderData.deliveryDate} {orderData.deliveryTime}</p>
                <p><strong>Pastel:</strong> {orderData.flavorText} / {orderData.fillingText}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Total ($)</label>
                    <input
                        type="number"
                        value={orderData.total}
                        onChange={(e) => updateOrder({ total: e.target.value })}
                        className="w-full p-2 border border-gray-300 rounded-lg font-bold text-lg"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Anticipo ($)</label>
                    <input
                        type="number"
                        value={orderData.advance}
                        onChange={(e) => updateOrder({ advance: e.target.value })}
                        className="w-full p-2 border border-gray-300 rounded-lg text-lg"
                    />
                </div>
            </div>

            <div className="flex justify-between mt-6">
                <button onClick={prevStep} className="text-gray-500 hover:text-gray-700">Atrás</button>
                <button
                    onClick={handleFinish}
                    disabled={submitting}
                    className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 transition font-bold shadow-lg"
                >
                    {submitting ? 'Guardando...' : 'Finalizar Pedido'}
                </button>
            </div>
        </div>
    );

    return (
        <OrderWizardLayout title="Nuevo Pedido">
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}
            {step === 4 && renderStep4()}
        </OrderWizardLayout>
    );
};

export default NewFolioWizard;
