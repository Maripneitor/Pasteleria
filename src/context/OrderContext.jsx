import React, { createContext, useContext, useState } from 'react';

const OrderContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export const useOrder = () => useContext(OrderContext);

export const OrderProvider = ({ children }) => {
    const [step, setStep] = useState(1);
    const [orderData, setOrderData] = useState({
        clientName: '',
        clientPhone: '',
        // Products (Pastel Principal)
        products: [], // { id, flavor, filling, design... } 

        // New Arrays
        complements: [], // Complex extra cakes: { personas, flavor, filling... }
        extras: [],      // Simple items: { qty, name, price }

        // Delivery
        deliveryDate: '',
        deliveryTime: '',
        isDelivery: false,
        deliveryLocation: '', // General field (legacy or simple)
        calle: '',
        colonia: '',
        referencias: '',
        shippingCost: 0,

        total: 0,
        advance: 0,
        applyCommission: false
    });

    const updateOrder = (data) => {
        setOrderData((prev) => {
            // Support functional updates: updateOrder(prev => ({...}))
            const newData = typeof data === 'function' ? data(prev) : data;
            return { ...prev, ...newData };
        });
    };

    const nextStep = () => setStep((p) => Math.min(p + 1, 6));
    const prevStep = () => setStep((p) => Math.max(p - 1, 1));

    return (
        <OrderContext.Provider value={{ step, setStep, nextStep, prevStep, orderData, updateOrder }}>
            {children}
        </OrderContext.Provider>
    );
};
