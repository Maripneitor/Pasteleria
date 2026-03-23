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

        // New Arrays (Fixed sizes for AI/Bot stability)
        complements: Array.from({ length: 3 }, () => ({ personas: '', forma: 'Redondo', sabor: '', relleno: '', descripcion: '', precio: 0 })),
        extras: [],      // Simple items: { qty, name, price }
        pisos: Array.from({ length: 8 }, () => ({ personas: '', panes: [], rellenos: [], notas: '' })),

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
        // --- FUNCIÓN DE NORMALIZACIÓN (Cura el Spanglish y Strings de OpenAI) ---
        const normalizeArray = (val) => {
            if (!val) return [];
            if (Array.isArray(val)) return val;
            if (typeof val === 'string') return val.split(',').map(s => s.trim());
            return [val];
        };

        // 1. HIDRATACIÓN SÚPER ROBUSTA DE PISOS
        let rawPisos = folio.detallesPisos || folio.diseno_metadata?.pisos || [];
        
        // Si viene doblemente stringificado desde parseArraySafe/MySQL
        try { if (typeof rawPisos === 'string') rawPisos = JSON.parse(rawPisos); } catch(e) {}
        try { if (typeof rawPisos === 'string') rawPisos = JSON.parse(rawPisos); } catch(e) {}
        
        // Si OpenAI devolvió un Objeto en vez de un Array, lo envolvemos
        let parsedPisos = Array.isArray(rawPisos) ? rawPisos : (rawPisos && typeof rawPisos === 'object' ? [rawPisos] : []);

        // 2. HIDRATACIÓN SÚPER ROBUSTA DE COMPLEMENTARIOS
        let rawComps = folio.complementosList || folio.complementarios || folio.complementos || [];

        try { if (typeof rawComps === 'string') rawComps = JSON.parse(rawComps); } catch(e) {}
        try { if (typeof rawComps === 'string') rawComps = JSON.parse(rawComps); } catch(e) {}
        
        let parsedComplements = Array.isArray(rawComps) ? rawComps : (rawComps && typeof rawComps === 'object' ? [rawComps] : []);

        // 3. AUTO-DETECCIÓN INTELIGENTE DEL TIPO DE PASTEL
        const hasValidPisos = parsedPisos.some(p => p && (parseInt(p.personas || p.persons || 0) > 0 || (p.panes && p.panes.length > 0) || p.notas || p.description));
        
        let tipoFolioCalculado = 'Normal';
        const tfStr = String(folio.tipo_folio || '').toLowerCase();
        
        // Curamos el "Base/Especial" de OpenAI para que React entienda que es "Base"
        if (tfStr.includes('base') || tfStr.includes('especial') || hasValidPisos) {
            tipoFolioCalculado = 'Base';
        }

        setOrderData({
            id: folio.id, 
            clientName: folio.cliente_nombre || '',
            clientPhone: folio.cliente_telefono || '',
            clientId: folio.clientId,
            selectedClient: folio.clientId ? { id: folio.clientId, name: folio.cliente_nombre, phone: folio.cliente_telefono } : null,
            
            // Inyectamos el tipo curado
            tipo_folio: tipoFolioCalculado,
            peopleCount: folio.numero_personas || '',
            shape: folio.forma || 'Redondo',
            panes: normalizeArray(folio.sabores_pan),
            rellenos: normalizeArray(folio.rellenos),
            
            extras: folio.accesorios || [],
            
            deliveryDate: folio.fecha_entrega || '',
            deliveryTime: folio.hora_entrega || '',
            
            is_delivery: !!folio.is_delivery,
            calle: folio.calle || '',
            num_ext: folio.num_ext || '',
            colonia: folio.colonia || '',
            referencias: folio.referencias || '',
            ubicacion_maps: folio.ubicacion_maps || '',
            shippingCost: Number(folio.costo_envio) || 0,
            costo_base: Number(folio.costo_base) || 0,
            
            descripcion_diseno: folio.descripcion_diseno || '',
            dedicatoria: folio.dedicatoria || '',
            extraHeight: folio.altura_extra === 'Si',
            referenceImages: folio.diseno_metadata?.allImages || (folio.imagen_referencia_url ? [folio.imagen_referencia_url] : []),
            
            total: Number(folio.total) || 0,
            advance: Number(folio.anticipo) || 0,
            applyCommission: false,
            
            // 4. MAPEO DE PISOS (Traduce llaves en inglés si OpenAI falló, y normaliza strings a arrays)
            pisos: [...parsedPisos, ...Array.from({ length: 8 }, () => ({}))]
                   .map(p => ({
                       personas: p.personas || p.persons || '',
                       panes: normalizeArray(p.panes || p.flavor),
                       rellenos: normalizeArray(p.rellenos || p.filling),
                       notas: p.notas || p.description || ''
                   }))
                   .slice(0, 8),
            
            // 5. MAPEO DE COMPLEMENTARIOS (Traduce estrictamente de "persons", "shape", etc. al español)
            complements: [...parsedComplements, ...Array.from({ length: 3 }, () => ({}))]
                   .map(c => ({
                       personas: c.personas || c.persons || '',
                       forma: c.forma || c.shape || 'Redondo',
                       sabor: c.sabor || c.flavor || '',
                       relleno: c.relleno || c.filling || '',
                       descripcion: c.descripcion || c.description || '',
                       precio: Number(c.precio || c.price || 0)
                   }))
                   .slice(0, 3)
        });
        
        setStep(1); 
    };

    return (
        <OrderContext.Provider value={{ step, setStep, nextStep, prevStep, orderData, updateOrder, loadOrder, resetOrder }}>
            {children}
        </OrderContext.Provider>
    );
};
