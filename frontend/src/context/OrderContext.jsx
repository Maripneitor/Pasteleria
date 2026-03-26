import React, { createContext, useContext, useState } from 'react';

const OrderContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export const useOrder = () => useContext(OrderContext);

export const OrderProvider = ({ children }) => {
    const [step, setStep] = useState(1);
    // 1. ESTADO INICIAL (Alineado con los nombres correctos)
    const [orderData, setOrderData] = useState({
        clientName: '',
        clientPhone: '',
        clientPhoneExtra: '', // Agregado
        
        products: [], 
        complements: Array.from({ length: 3 }, () => ({ personas: '', forma: 'Redondo', sabor: '', relleno: '', descripcion: '', precio: 0 })),
        extras: [],      
        pisos: Array.from({ length: 8 }, () => ({ personas: '', panes: [], rellenos: [], notas: '' })),

        deliveryDate: '',
        deliveryTime: '',
        is_delivery: false, // CORREGIDO (antes era isDelivery)
        calle: '',
        num_ext: '',        // Agregado
        colonia: '',
        referencias: '',
        ubicacion_maps: '', // Agregado
        costo_envio: 0,     // CORREGIDO (antes era shippingCost)

        costo_base: 0,
        total: 0,
        advance: 0,
        applyCommission: false,
        
        descripcion_diseno: '',
        dedicatoria: '',
        extraHeight: false,
        referenceImages: []
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
            complements: Array.from({ length: 3 }, () => ({ personas: '', forma: 'Redondo', sabor: '', relleno: '', descripcion: '', precio: 0 })),
            extras: [],
            pisos: Array.from({ length: 8 }, () => ({ personas: '', panes: [], rellenos: [], notas: '' })),
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
        // 🛡️ PARCHE MYSQL: Convierte strings a JSON si es necesario
        let rawComps = folio.complementarios || folio.complementos || [];
        if (typeof rawComps === 'string') {
            try { rawComps = JSON.parse(rawComps); } catch(e) { rawComps = []; }
        }
        if (!Array.isArray(rawComps)) rawComps = [];

        const parsedComplements = rawComps.map(c => ({
            personas: c.numero_personas || c.personas || '',
            forma: c.forma || 'Redondo',
            sabor: (Array.isArray(c.sabores_pan) ? c.sabores_pan[0] : c.sabor) || '',
            relleno: (Array.isArray(c.rellenos) ? c.rellenos[0] : c.relleno) || '',
            descripcion: c.descripcion || '',
            precio: c.precio || 0
        }));

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
            
            pisos: (folio.diseno_metadata?.pisos?.length === 8) 
                ? folio.diseno_metadata.pisos 
                : [...(folio.diseno_metadata?.pisos || []), ...Array.from({ length: Math.max(0, 8 - (folio.diseno_metadata?.pisos?.length || 0)) }, () => ({ personas: '', panes: [], rellenos: [], notas: '' }))].slice(0, 8),
            
            // 🔥 REHIDRATACIÓN SEGURA DE COMPLEMENTOS
            complements: [...parsedComplements, ...Array.from({ length: 3 }, () => ({ personas: '', forma: 'Redondo', sabor: '', relleno: '', descripcion: '', precio: 0 }))].slice(0, 3)
        });
        setStep(1);
    };

    return (
        <OrderContext.Provider value={{ step, setStep, nextStep, prevStep, orderData, updateOrder, loadOrder, resetOrder }}>
            {children}
        </OrderContext.Provider>
    );
};
