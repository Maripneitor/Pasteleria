import React from 'react';
import { useOrder } from '../context/OrderContext';
import { Check } from 'lucide-react';

const OrderWizardLayout = ({ children, title }) => {
    const { step, setStep, orderData } = useOrder(); 
    const steps = ["Cliente", "Pedido", "Extras", "Diseño", "Entrega", "Pago"];

    const checkIsFilled = (index) => {
        if (!orderData) return false;

        switch (index) {
            case 0: 
                return Boolean(orderData.clientName?.trim() && orderData.clientPhone?.trim());
            case 1: 
                const hasNormal = Boolean(orderData.peopleCount && orderData.panes?.length > 0);
                const hasPisos = orderData.pisos?.some(p => Number(p.personas) > 0 && p.panes?.length > 0);
                return hasNormal || hasPisos;
            case 2: 
                const hasComps = orderData.complements?.some(c => c.sabor || Number(c.personas) > 0);
                const hasExtras = orderData.extras?.length > 0;
                return hasComps || hasExtras;
            case 3: 
                return Boolean(orderData.descripcion_diseno?.trim() || orderData.referenceImages?.length > 0);
            case 4: 
                const hasDate = Boolean(orderData.deliveryDate && orderData.deliveryTime);
                return orderData.is_delivery ? (hasDate && Boolean(orderData.calle?.trim() && orderData.colonia?.trim())) : hasDate;
            case 5: 
                return false; 
            default:
                return false;
        }
    };

    return (
        <div className="max-w-5xl mx-auto p-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">{title}</h1>

            {/* Barra de progreso */}
            <div className="flex justify-between items-center mb-8 relative z-0">
                <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-200 -z-10 rounded-full"></div>
                <div
                    className="absolute top-1/2 left-0 h-1 bg-pink-500 -z-10 rounded-full transition-all duration-500"
                    style={{ width: `${((step - 1) / 5) * 100}%` }}
                ></div>

                {steps.map((label, index) => {
                    const stepNum = index + 1;
                    const isActive = step === stepNum;
                    const isCompleted = checkIsFilled(index);
                    const isOptional = index === 2; // Identificamos el Paso 3 (Extras/Complementos)

                    let circleStyles = "bg-white border-2 border-gray-300 text-gray-400";
                    let textStyles = "text-gray-400";

                    if (isActive) {
                        circleStyles = "bg-pink-600 border-pink-600 text-white scale-110 shadow-lg ring-4 ring-pink-100";
                        textStyles = "text-pink-600 font-black";
                    } else if (isCompleted) {
                        circleStyles = "bg-pink-500 border-pink-500 text-white shadow-md cursor-pointer hover:bg-pink-600";
                        textStyles = "text-pink-500 font-bold";
                    } else if (isOptional) {
                        // ✨ LÓGICA VISUAL AMARILLA PARA EL PASO OPCIONAL
                        circleStyles = "bg-yellow-50 border-2 border-dashed border-yellow-400 text-yellow-600 cursor-pointer hover:bg-yellow-100";
                        textStyles = "text-yellow-600 font-bold";
                    } else if (step > stepNum) {
                        circleStyles = "bg-white border-2 border-dashed border-gray-300 text-gray-400 cursor-pointer hover:border-pink-300";
                        textStyles = "text-gray-500";
                    }

                    return (
                        <div 
                            key={label} 
                            onClick={() => setStep(stepNum)} 
                            className="flex flex-col items-center gap-1 px-2 bg-gray-50 z-10 cursor-pointer group"
                        >
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all duration-300 ${circleStyles}`}>
                                {isCompleted && !isActive ? <Check size={20} strokeWidth={3} /> : stepNum}
                            </div>
                            <div className="text-center flex flex-col items-center">
                                <span className={`text-xs transition-colors duration-300 ${textStyles} group-hover:text-pink-500`}>
                                    {label}
                                </span>
                                {/* Mini etiqueta para reafirmar que es opcional */}
                                {isOptional && !isCompleted && !isActive && (
                                    <span className="text-[9px] text-yellow-600 font-bold tracking-wider mt-0.5">
                                        (OPCIONAL)
                                    </span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 min-h-[400px] transition-all">
                {children}
            </div>
        </div>
    );
};

export default OrderWizardLayout;