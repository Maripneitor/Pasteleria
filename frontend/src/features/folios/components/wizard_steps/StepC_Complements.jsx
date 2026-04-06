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

    const [localComps, setLocalComps] = useState(() => {
        const ctxComps = orderData.complements || orderData.complementosList || orderData.complementarios || [];
        
        return Array.from({ length: 3 }, (_, i) => {
            const c = ctxComps[i] || {};
            const saborReal = c.sabor || c.sabor_pan || (Array.isArray(c.sabores_pan) ? c.sabores_pan[0] : '') || '';
            const rellenoReal = c.relleno || (Array.isArray(c.rellenos) ? c.rellenos[0] : '') || '';

            return {
                personas: c.personas || c.numero_personas || '',
                forma: c.forma || 'Redondo',
                sabor: saborReal,     
                relleno: rellenoReal, 
                descripcion: c.descripcion || '',
                precio: 0 // 🔥 Siempre 0, el usuario lo cobra en el Precio Total del Pastel
            };
        });
    });

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

    useEffect(() => {
        updateOrder({ complements: localComps });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [localComps]);

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
                                className="w-full p-2 border border-gray-300 rounded-lg bg-white text-sm"
                            >
                                {shapes.length > 0 ? (
                                    shapes.map(s => <option key={s.id} value={s.name}>{s.name}</option>)
                                ) : (
                                    <>
                                        <option value="Redondo">Redondo</option>
                                        <option value="Cuadrado">Cuadrado</option>
                                        <option value="Rectangular">Rectangular</option>
                                        <option value="Corazon">Corazón</option>
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