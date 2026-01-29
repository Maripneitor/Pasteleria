import React from 'react';
import { OrderProvider, useOrder } from '../context/OrderContext';
import OrderWizardLayout from '../components/OrderWizardLayout';

// Importa aquí tus sub-componentes de pasos (Step1, Step2...)
// Por brevedad, los simularé como componentes internos, pero deberían ir en archivos separados.
const StepClient = () => {
    const { updateOrder, nextStep, orderData } = useOrder();
    return (
        <div className="space-y-4">
            <h2 className="text-xl font-bold">¿Quién ordena?</h2>
            <input
                type="text"
                placeholder="Nombre del Cliente"
                className="w-full p-3 border rounded-xl"
                value={orderData.clientName}
                onChange={(e) => updateOrder({ clientName: e.target.value })}
            />
            <div className="flex justify-end mt-4">
                <button onClick={nextStep} className="px-6 py-2 bg-pink-500 text-white rounded-lg">Siguiente</button>
            </div>
        </div>
    );
};

// ... Definir StepProduct, StepDetails, StepPayment de igual forma ...

const WizardContent = () => {
    const { step } = useOrder();

    return (
        <OrderWizardLayout title="Nuevo Pedido">
            {step === 1 && <StepClient />}
            {step === 2 && <div className="p-4 text-center">Componente Selección Productos (Pendiente)</div>}
            {step === 3 && <div className="p-4 text-center">Componente Detalles Entrega (Pendiente)</div>}
            {step === 4 && <div className="p-4 text-center">Componente Resumen y Pago (Pendiente)</div>}
        </OrderWizardLayout>
    );
};

const NewOrderPage = () => {
    return (
        <OrderProvider>
            <WizardContent />
        </OrderProvider>
    );
};

export default NewOrderPage;
