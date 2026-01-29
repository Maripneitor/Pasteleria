import React from 'react';
import { useOrder } from '../context/OrderContext';
import { Check, ChevronRight } from 'lucide-react';

const OrderWizardLayout = ({ children, title }) => {
    const { step } = useOrder();
    const steps = ["Cliente", "Productos", "Detalles", "Pago"];

    return (
        <div className="max-w-4xl mx-auto p-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">{title}</h1>

            {/* Progress Bar */}
            <div className="flex justify-between items-center mb-8 relative">
                <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-200 -z-10 rounded-full"></div>
                <div
                    className="absolute top-1/2 left-0 h-1 bg-pink-500 -z-10 rounded-full transition-all duration-500"
                    style={{ width: `${((step - 1) / 3) * 100}%` }}
                ></div>

                {steps.map((label, index) => {
                    const stepNum = index + 1;
                    const isActive = step >= stepNum;
                    const isCompleted = step > stepNum;

                    return (
                        <div key={label} className="flex flex-col items-center gap-2 bg-gray-50 px-2">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${isActive ? 'bg-pink-500 text-white scale-110 shadow-lg' : 'bg-gray-300 text-gray-500'
                                }`}>
                                {isCompleted ? <Check size={20} /> : stepNum}
                            </div>
                            <span className={`text-xs font-bold ${isActive ? 'text-pink-600' : 'text-gray-400'}`}>{label}</span>
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
