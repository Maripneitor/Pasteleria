import React, { createContext, useContext, useState } from 'react';

const OrderContext = createContext();

export const useOrder = () => useContext(OrderContext);

export const OrderProvider = ({ children }) => {
    const [step, setStep] = useState(1);
    
    const [orderData, setOrderData] = useState({
        clientName: '', clientPhone: '', clientPhoneExtra: '',
        products: [], 
        complements: Array.from({ length: 3 }, () => ({ personas: '', forma: 'Redondo', sabor: '', relleno: '', descripcion: '', precio: 0 })),
        extras: [],      
        pisos: Array.from({ length: 8 }, () => ({ personas: '', panes: [], rellenos: [], notas: '' })),
        deliveryDate: '', deliveryTime: '', is_delivery: false,
        calle: '', num_ext: '', num_int: '', colonia: '', referencias: '', ubicacion_maps: '', costo_envio: 0,
        costo_base: 0, total: 0, anticipo: 0, aplica_comision: false, 
        descripcion_diseno: '', dedicatoria: '',
        extraHeight: false, // 🚀 Fuente única de verdad inicializada
        referenceImages: []
    });

    const updateOrder = (data) => {
        setOrderData((prev) => {
            const newData = typeof data === 'function' ? data(prev) : data;
            return { ...prev, ...newData };
        });
    };

    const nextStep = () => setStep((p) => Math.min(p + 1, 6));
    const prevStep = () => setStep((p) => Math.max(p - 1, 1));

    const resetOrder = () => {
        setStep(1);
        setOrderData({
            clientName: '', clientPhone: '', clientPhoneExtra: '', 
            products: [],
            complements: Array.from({ length: 3 }, () => ({ personas: '', forma: 'Redondo', sabor: '', relleno: '', descripcion: '', precio: 0 })),
            extras: [],
            pisos: Array.from({ length: 8 }, () => ({ personas: '', panes: [], rellenos: [], notas: '' })),
            deliveryDate: '', deliveryTime: '', is_delivery: false,
            calle: '', num_ext: '', num_int: '', colonia: '', referencias: '', ubicacion_maps: '', costo_envio: 0,
            total: 0, anticipo: 0, aplica_comision: false, 
            descripcion_diseno: '', dedicatoria: '',
            extraHeight: false,
            referenceImages: []
        });
    };

    const loadOrder = (folio) => {
        let rawComps = folio.complementosList || folio.complementarios || folio.complementos || [];
        if (typeof rawComps === 'string') {
            try { rawComps = JSON.parse(rawComps); } catch(e) { rawComps = []; }
        }
        if (!Array.isArray(rawComps)) rawComps = [];

        const parsedComplements = rawComps.map(c => ({
            personas: c.numero_personas || c.personas || '',
            forma: c.forma || 'Redondo',
            sabor: (Array.isArray(c.sabores_pan) ? c.sabores_pan[0] : (c.sabor || c.sabor_pan)) || '',
            relleno: (Array.isArray(c.rellenos) ? c.rellenos[0] : c.relleno) || '',
            descripcion: c.descripcion || '',
            precio: parseFloat(c.precio) || 0 
        }));

        setOrderData({
            id: folio.id, 
            clientName: folio.cliente_nombre || '',
            clientPhone: folio.cliente_telefono || '',
            clientPhoneExtra: folio.cliente_telefono_extra || '',
            clientId: folio.clientId,
            selectedClient: folio.clientId ? { 
                id: folio.clientId, name: folio.cliente_nombre, phone: folio.cliente_telefono, phone2: folio.cliente_telefono_extra
            } : null,
            
            tipo_folio: folio.tipo_folio || 'Normal',
            peopleCount: folio.numero_personas || '',
            shape: folio.forma || 'Redondo',
            panes: Array.isArray(folio.sabores_pan) ? folio.sabores_pan : [],
            rellenos: Array.isArray(folio.rellenos) ? folio.rellenos : [],
            extras: folio.accesorios || [],
            deliveryDate: folio.fecha_entrega || '',
            deliveryTime: folio.hora_entrega || '',
            is_delivery: !!folio.is_delivery,
            calle: folio.calle || '', num_ext: folio.num_ext || '', num_int: folio.num_int || '', 
            colonia: folio.colonia || '', referencias: folio.referencias || '', ubicacion_maps: folio.ubicacion_maps || '',
            costo_envio: folio.costo_envio || 0, costo_base: folio.costo_base || 0,
            descripcion_diseno: folio.descripcion_diseno || '', dedicatoria: folio.dedicatoria || '',
            
            // 🚀 FIX: Única fuente de verdad en base a lo que mande el backend (booleano garantizado)
            extraHeight: folio.altura_extra === 'Sí' || folio.altura_extra === 'Si' || String(folio.extraHeight) === 'true',
            
            referenceImages: folio.diseno_metadata?.allImages || (folio.imagen_referencia_url ? [folio.imagen_referencia_url] : []),
            total: folio.total || 0, anticipo: folio.anticipo || 0, aplica_comision: !!folio.aplica_comision, 
            
            pisos: (folio.diseno_metadata?.pisos?.length === 8) 
                ? folio.diseno_metadata.pisos 
                : [...(folio.diseno_metadata?.pisos || []), ...Array.from({ length: Math.max(0, 8 - (folio.diseno_metadata?.pisos?.length || 0)) }, () => ({ personas: '', panes: [], rellenos: [], notas: '' }))].slice(0, 8),
            
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