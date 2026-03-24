import React from 'react';
import { useOrder } from '../context/OrderContext';
import { Check } from 'lucide-react';

const OrderWizardLayout = ({ children, title }) => {
    const { step, setStep, orderData } = useOrder(); 
    const steps = ["Cliente", "Pedido", "Extras", "Diseño", "Entrega", "Pago"];

    // 🔥 CEREBRO MEJORADO: Ahora evalúa validez, si es opcional y SI TIENE DATOS
    const checkStepStatus = (stepIndex) => {
        if (!orderData) return { isValid: false, isOptional: false, hasData: false };
        
        switch (stepIndex) {
            case 1: { // Cliente (Obligatorio)
                const hasData = !!(orderData.clientName && orderData.clientPhone);
                return { isValid: hasData, isOptional: false, hasData };
            }
            case 2: { // Pedido (Obligatorio)
                const isBase = orderData.tipo_folio === 'Base' || orderData.tipo_folio === 'Base/Especial';
                const hasPisos = isBase && (orderData.pisos || []).some(p => p.personas && parseInt(p.personas) > 0);
                const hasSelections = orderData.panes?.length > 0 && orderData.rellenos?.length > 0;
                const hasData = !!(orderData.deliveryDate && orderData.deliveryTime && orderData.peopleCount && (isBase ? hasPisos : hasSelections));
                return { isValid: hasData, isOptional: false, hasData };
            }
            case 3: { // Extras (Opcional)
                const hasComplements = (orderData.complements || []).some(c => c.sabor || (c.personas && parseInt(c.personas) > 0));
                const hasExtras = (orderData.extras || []).length > 0;
                const hasData = hasComplements || hasExtras;
                return { isValid: true, isOptional: true, hasData };
            }
            case 4: { // Diseño (Opcional)
                const hasData = !!(orderData.descripcion_diseno || orderData.dedicatoria || (orderData.referenceImages && orderData.referenceImages.length > 0) || orderData.extraHeight);
                return { isValid: true, isOptional: true, hasData };
            }
            case 5: { // Entrega (Obligatorio)
                const isValid = !orderData.is_delivery || !!(orderData.calle && orderData.colonia);
                return { isValid, isOptional: false, hasData: isValid };
            }
            case 6: { // Pago (Final)
                return { isValid: true, isOptional: false, hasData: true };
            }
            default:
                return { isValid: false, isOptional: false, hasData: false };
        }
    };

    return (
        <div className="max-w-5xl mx-auto p-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">{title}</h1>

            {/* Progress Bar */}
            <div className="flex justify-between items-center mb-8 relative">
                <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-200 -z-10 rounded-full"></div>
                <div
                    className="absolute top-1/2 left-0 h-1 bg-pink-500 -z-10 rounded-full transition-all duration-500"
                    style={{ width: `${((step - 1) / 5) * 100}%` }}
                ></div>

                {steps.map((label, index) => {
                    const stepNum = index + 1;
                    
                    const { isValid, isOptional, hasData } = checkStepStatus(stepNum);
                    
                    // Lógica del Tiempo
                    const isCurrent = step === stepNum;
                    const isPast = stepNum < step; 
                    
                    // Lógica Visual
                    const showGreen = isPast && isValid && hasData; // Lo pasó y TIENE DATOS
                    const showYellow = isPast && isValid && isOptional && !hasData; // Lo pasó, es opcional, pero está VACÍO
                    const showRed = isPast && !isValid; // Lo pasó y le faltan datos obligatorios

                    let circleClasses = 'w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all shadow-sm ';
                    let textClasses = 'text-xs font-bold mt-2 ';

                    if (isCurrent) {
                        // 🩷 Paso Actual: Rosa brillante
                        circleClasses += 'bg-pink-600 text-white scale-110 shadow-pink-300 shadow-md ring-4 ring-pink-50';
                        textClasses += 'text-pink-600 scale-105';
                    } else if (showGreen) {
                        // 🟢 Paso Lleno: Verde
                        circleClasses += 'bg-green-500 text-white';
                        textClasses += 'text-green-600';
                    } else if (showYellow) {
                        // 🟡 Paso Opcional Vacío: Amarillo
                        circleClasses += 'bg-yellow-400 text-yellow-900';
                        textClasses += 'text-yellow-600';
                    } else if (showRed) {
                        // 🔴 Paso Obligatorio Vacío: Rojo
                        circleClasses += 'bg-red-50 text-red-500 border border-red-300';
                        textClasses += 'text-red-500';
                    } else {
                        // ⚪ Paso Futuro: Gris
                        circleClasses += 'bg-gray-200 text-gray-500';
                        textClasses += 'text-gray-400';
                    }

                    return (
                        <div 
                            key={label} 
                            className="flex flex-col items-center bg-white px-2 cursor-pointer hover:-translate-y-1 transition-transform duration-200"
                            onClick={() => setStep(stepNum)} 
                        >
                            <div className={circleClasses}>
                                {showGreen || showYellow ? <Check size={20} /> : stepNum}
                            </div>
                            <span className={textClasses}>
                                {label} {showYellow && <span className="text-[9px] block text-center font-normal opacity-75">Opcional</span>}
                            </span>
                        </div>
                    );
                })}
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 min-h-[400px]">
                {children}
            </div>
        </div>
    );
};

export default OrderWizardLayout;