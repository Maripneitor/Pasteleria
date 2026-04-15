import React, { useState, useEffect } from 'react';
import { useOrder } from '@/context/OrderContext';
import { Loader2 } from 'lucide-react';
import catalogApi from '@/features/catalogs/api/catalogs.api';

const StepC_Complements = ({ next, prev }) => {
    const { orderData, updateOrder } = useOrder();
    const [flavors, setFlavors] = useState([]);
    const [fillings, setFillings] = useState([]);
    const [shapes, setShapes] = useState([]); 
    const [sizes, setSizes] = useState([]);   
    const [loading, setLoading] = useState(true);
    const [hasHydrated, setHasHydrated] = useState(false); // 🚀 FIX: Candado de Hidratación

    const [localComps, setLocalComps] = useState(() => {
        const ctxComps = orderData.complements || orderData.complementosList || orderData.complementarios || [];
        return Array.from({ length: 3 }, (_, i) => {
            const c = ctxComps[i] || {};
            return {
                personas: c.personas || c.numero_personas || '',
                forma: c.forma || c.shape || 'Redondo',
                sabor: c.sabor || c.sabor_pan || (Array.isArray(c.sabores_pan) ? c.sabores_pan[0] : '') || '',     
                relleno: c.relleno || (Array.isArray(c.rellenos) ? c.rellenos[0] : '') || '', 
                descripcion: c.descripcion || c.description || '',
                precio: c.precio || 0 
            };
        });
    });

    // 1. Cargar Catálogos
    useEffect(() => {
        const load = async () => {
            try {
                const [f, c, sh, sz] = await Promise.all([
                    catalogApi.getFlavors(false).catch(() => []),
                    catalogApi.getFillings(false).catch(() => []),
                    catalogApi.getShapes('COMPLEMENTARY', false).catch(() => []),
                    catalogApi.getSizes('COMPLEMENTARY', false).catch(() => [])
                ]);
                setFlavors(f);
                setFillings(c);
                setShapes(sh);
                setSizes(sz);
            } catch (e) {
                console.error("Error cargando catálogos en StepC:", e);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    // 2. Hidratación Inteligente y Normalizada
    useEffect(() => {
        if (hasHydrated) return; // Si ya hidratamos, no lo volvemos a hacer
        if (sizes.length === 0 || shapes.length === 0 || flavors.length === 0 || fillings.length === 0) return;

        const sourceComps = orderData.complements || orderData.complementosList || orderData.complementarios || [];
        
        // Normalizador antibugs (quita acentos, mayúsculas y espacios extra)
        const normalize = (str) => {
            if (typeof str !== 'string') return '';
            return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
        };

        const mapped = Array.from({ length: 3 }, (_, i) => {
            const c = sourceComps[i] || {};
            
            // Mapeo Personas
            let personasVal = '';
            if (c.personas) {
                const numStr = String(c.personas).replace(/[^0-9]/g, '');
                const matchSize = sizes.find(s => String(s.name).replace(/[^0-9]/g, '') === numStr);
                personasVal = matchSize ? matchSize.name : String(c.personas);
            }

            // 🚀 FIX: Mapeo Forma Ultra-Agresivo
            let formaVal = c.forma || c.shape || '';
            if (formaVal && formaVal.toLowerCase() !== 'redondo') { 
                const normForma = normalize(formaVal);
                const matchShape = shapes.find(s => 
                    normalize(s.name) === normForma || 
                    normalize(s.name).includes(normForma) || 
                    normForma.includes(normalize(s.name))
                );
                if (matchShape) formaVal = matchShape.name;
            }

            // Mapeo Sabor
            let saborReal = c.sabor || c.sabor_pan || (Array.isArray(c.sabores_pan) ? c.sabores_pan[0] : '') || '';
            if (saborReal) {
                const normSabor = normalize(saborReal);
                const matchFlavor = flavors.find(f => normalize(f.name) === normSabor || normalize(f.name).includes(normSabor) || normSabor.includes(normalize(f.name)));
                if (matchFlavor) saborReal = matchFlavor.name;
            }

            // Mapeo Relleno
            let rellenoReal = c.relleno || (Array.isArray(c.rellenos) ? c.rellenos[0] : '') || '';
            if (rellenoReal) {
                const normRelleno = normalize(rellenoReal);
                const matchFilling = fillings.find(f => normalize(f.name) === normRelleno || normalize(f.name).includes(normRelleno) || normRelleno.includes(normalize(f.name)));
                if (matchFilling) rellenoReal = matchFilling.name;
            }

            return {
                personas: personasVal,
                forma: formaVal,
                sabor: saborReal,     
                relleno: rellenoReal, 
                descripcion: c.descripcion || c.description || '',
                precio: c.precio || 0 
            };
        });
        
        setLocalComps(mapped);
        setHasHydrated(true); // 🚀 FIX: Cerramos el candado. Ya no se volverá a ejecutar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sizes, shapes, flavors, fillings, hasHydrated, orderData.complements]);

    // 3. Sincronización al Contexto Global
    useEffect(() => {
        if (!hasHydrated) return; // 🚀 FIX: Prohibido sincronizar basura hacia el backend si no hemos hidratado
        
        updateOrder({ 
            complements: localComps, 
            complementsList: localComps,
            complementarios: localComps 
        });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [localComps, hasHydrated]);

    const updateComplement = (index, field, value) => {
        setLocalComps(prev => {
            const newComps = [...prev];
            newComps[index] = { ...newComps[index], [field]: value };
            return newComps;
        });
    };

    if (loading) return <div className="p-8 text-center"><Loader2 className="animate-spin text-pink-500 mx-auto" /></div>;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <span className="bg-pink-100 text-pink-600 w-8 h-8 rounded-full flex items-center justify-center text-sm">C</span>
                Pasteles Complementarios (Opcional)
            </h2>
            <p className="text-gray-500 text-sm">El precio de estos pasteles deberá sumarse manualmente al 'Precio Total del Pastel' en el último paso.</p>

            {localComps.map((comp, idx) => (
                <div key={idx} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm relative animate-in fade-in slide-in-from-bottom-2">
                    <span className="absolute -top-2 -left-2 bg-pink-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                        COMPLEMENTO {idx + 1}
                    </span>

                    <div className="grid md:grid-cols-4 gap-4 mb-3 mt-2">
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase">Personas</label>
                            <select
                                value={comp.personas || ''}
                                onChange={(e) => updateComplement(idx, 'personas', e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-lg bg-white text-sm focus:ring-2 focus:ring-pink-500 outline-none"
                            >
                                <option value="">Seleccione...</option>
                                {sizes.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase">Forma</label>
                            <select
                                value={comp.forma || ''}
                                onChange={(e) => updateComplement(idx, 'forma', e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-lg bg-white text-sm focus:ring-2 focus:ring-pink-500 outline-none"
                            >
                                {/* 🚀 FIX: Agregamos la opción neutra para evitar que el navegador auto-seleccione el primero */}
                                <option value="">Seleccione...</option>
                                
                                {shapes.length > 0 ? (
                                    shapes.map(s => <option key={s.id} value={s.name}>{s.name}</option>)
                                ) : (
                                    <>
                                        <option value="Círculo">Círculo</option>
                                        <option value="Huevo">Huevo</option>
                                        <option value="Pilín">Pilín</option>
                                        <option value="Cuadrado">Cuadrado</option>
                                        <option value="Rectangular">Rectangular</option>
                                    </>
                                )}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase">Sabor</label>
                            <select
                                value={comp.sabor || ''}
                                onChange={(e) => updateComplement(idx, 'sabor', e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-lg bg-white text-sm"
                            >
                                <option value="">Original / Vacio</option>
                                {flavors.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase">Relleno</label>
                            <select
                                value={comp.relleno || ''}
                                onChange={(e) => updateComplement(idx, 'relleno', e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-lg bg-white text-sm"
                            >
                                <option value="">Original / Vacio</option>
                                {fillings.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <div className="flex-1">
                            <label className="text-xs font-bold text-gray-500 uppercase">Descripción / Detalles</label>
                            <input
                                type="text"
                                value={comp.descripcion || ''}
                                onChange={(e) => updateComplement(idx, 'descripcion', e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-pink-500 outline-none"
                                placeholder="Ej. Encima del principal, mismo color..."
                            />
                        </div>
                    </div>
                </div>
            ))}

            <div className="flex justify-between pt-6">
                <button onClick={prev} className="px-6 py-3 text-gray-600 font-bold hover:bg-gray-100 rounded-xl transition">Atrás</button>
                <button onClick={next} className="bg-pink-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-pink-700 transition shadow-lg shadow-pink-200">Siguiente</button>
            </div>
        </div>
    );
};

export default StepC_Complements;