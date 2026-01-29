import React from 'react';
import { OrderProvider, useOrder } from '../context/OrderContext';
import OrderWizardLayout from '../components/OrderWizardLayout';
import StepClient from '../components/orders/StepClient';
import StepProduct from '../components/orders/StepProduct';
import StepDetails from '../components/orders/StepDetails';
import StepPayment from '../components/orders/StepPayment';

const WizardContent = () => {
    const { step } = useOrder();

    return (
        <OrderWizardLayout title="Nuevo Pedido">
            {step === 1 && <StepClient />}
            {step === 2 && <StepProduct />}
            {step === 3 && <StepDetails />}
            {step === 4 && <StepPayment />}
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
