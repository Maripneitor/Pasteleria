import React from 'react';
import OrderWizardLayout from '../../components/OrderWizardLayout';
import { useOrder } from '../../context/OrderContext';

// New Modular Steps
import StepA_Client from './wizard_steps/StepA_Client';
import StepB_OrderDetails from './wizard_steps/StepB_OrderDetails';
import StepC_Complements from './wizard_steps/StepC_Complements';
import StepD_Design from './wizard_steps/StepD_Design';
import StepE_Logistics from './wizard_steps/StepE_Logistics';
import StepF_Payment from './wizard_steps/StepF_Payment';

const NewFolioWizard = () => {
    const { step, nextStep, prevStep } = useOrder();

    return (
        <OrderWizardLayout title="Nuevo Pedido (Folio)">
            {step === 1 && <StepA_Client next={nextStep} />}
            {step === 2 && <StepB_OrderDetails next={nextStep} prev={prevStep} />}
            {step === 3 && <StepC_Complements next={nextStep} prev={prevStep} />}
            {step === 4 && <StepD_Design next={nextStep} prev={prevStep} />}
            {step === 5 && <StepE_Logistics next={nextStep} prev={prevStep} />}
            {step === 6 && <StepF_Payment prev={prevStep} />}
        </OrderWizardLayout>
    );
};

export default NewFolioWizard;
