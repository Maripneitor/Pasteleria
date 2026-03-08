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

    const resetOrder = () => {
        setStep(1);
        setOrderData({
            clientName: '',
            clientPhone: '',
            products: [],
            complements: [],
            extras: [],
            deliveryDate: '',
            deliveryTime: '',
            is_delivery: false,
            calle: '',
            num_ext: '',
            colonia: '',
            referencias: '',
            ubicacion_maps: '',
            shippingCost: 0,
            total: 0,
            advance: 0,
            applyCommission: false,
            
            // Design
            descripcion_diseno: '',
            dedicatoria: '',
            extraHeight: false,
            referenceImages: []
        });
    };

    const loadOrder = (folio) => {
        setOrderData({
            id: folio.id, 
            clientName: folio.cliente_nombre || '',
            clientPhone: folio.cliente_telefono || '',
            clientId: folio.clientId,
            selectedClient: folio.clientId ? { id: folio.clientId, name: folio.cliente_nombre, phone: folio.cliente_telefono } : null,
            
            tipo_folio: folio.tipo_folio || 'Normal',
            peopleCount: folio.numero_personas || '',
            shape: folio.forma || 'Redondo',
            panes: Array.isArray(folio.sabores_pan) ? folio.sabores_pan : [],
            rellenos: Array.isArray(folio.rellenos) ? folio.rellenos : [],
            
            complements: folio.complementos || [],
            extras: folio.accesorios || [],
            
            deliveryDate: folio.fecha_entrega || '',
            deliveryTime: folio.hora_entrega || '',
            
            is_delivery: !!folio.is_delivery,
            calle: folio.calle || '',
            num_ext: folio.num_ext || '',
            colonia: folio.colonia || '',
            referencias: folio.referencias || '',
            ubicacion_maps: folio.ubicacion_maps || '',
            costo_envio: folio.costo_envio || 0,
            costo_base: folio.costo_base || 0,
            
            descripcion_diseno: folio.descripcion_diseno || '',
            dedicatoria: folio.dedicatoria || '',
            extraHeight: folio.altura_extra === 'Si',
            referenceImages: folio.diseno_metadata?.allImages || (folio.imagen_referencia_url ? [folio.imagen_referencia_url] : []),
            
            total: folio.total || 0,
            advance: folio.anticipo || 0,
            
            pisos: folio.tipo_folio === 'Base' ? (folio.diseno_metadata?.pisos || []) : []
        });
        setStep(1);
    };

    return (
        <OrderContext.Provider value={{ step, setStep, nextStep, prevStep, orderData, updateOrder, loadOrder, resetOrder }}>
            {children}
        </OrderContext.Provider>
    );
};
