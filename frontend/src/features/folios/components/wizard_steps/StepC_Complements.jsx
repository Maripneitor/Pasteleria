import React, { useState, useEffect } from 'react';
import { useOrder } from '@/context/OrderContext';
import catalogApi from '@/features/catalogs/api/catalogs.api';

const DEFAULT_COMPLEMENT = { personas: '', forma: 'Redondo', sabor: '', relleno: '', descripcion: '', precio: 0 };

const StepC_Complements = ({ next, prev }) => {
    const { orderData, updateOrder } = useOrder();
    const [flavors, setFlavors] = useState([]);
    const [fillings, setFillings] = useState([]);

    // 🧠 ESTADO LOCAL: Inicia con lo que hay en OrderData o valores por defecto
    const [localComps, setLocalComps] = useState(() => {
        const ctxComps = orderData.complements || [];
        return Array.from({ length: 3 }, (_, i) => ({
            ...DEFAULT_COMPLEMENT,
            ...(ctxComps[i] || {})
        }));
    });

    useEffect(() => {
        const load = async () => {
            const [f, c] = await Promise.all([
                catalogApi.getFlavors(false),
                catalogApi.getFillings(false)
            ]);
            setFlavors(f);
            setFillings(c);
        };
        load();
    }, []);

    // 🔄 SINCRONIZADOR: Empuja silenciosamente al Contexto cuando el usuario escribe
    useEffect(() => {
        updateOrder({ complements: localComps });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [localComps]);

    const handleChange = (index, field, value) => {
        setLocalComps(prev => {
            const newComps = [...prev];
            newComps[index] = { ...newComps[index], [field]: value };
            return newComps;
        });
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <span className="bg-pink-100 text-pink-600 w-8 h-8 rounded-full flex items-center justify-center text-sm">C</span>
                Pasteles Complementarios (Opcional)
            </h2>
            <p className="text-gray-500 text-sm">El bot puede llenar hasta 3 pasteles complementarios automáticamente. Los vacíos se ignorarán.</p>

            {localComps.map((comp, idx) => (
                <div key={idx} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm relative animate-in fade-in slide-in-from-bottom-2">
                    <span className="absolute -top-2 -left-2 bg-pink-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                        COMPLEMENTO {idx + 1}
                    </span>

                    <div className="grid md:grid-cols-4 gap-4 mb-3">
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase">Personas</label>
                            <input
                                type="number"
                                value={comp.personas}
                                onChange={(e) => handleChange(idx, 'personas', e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-pink-500 text-sm bg-gray-50 focus:bg-white"
                                placeholder="0"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase">Forma</label>
                            <select
                                value={comp.forma}
                                onChange={(e) => handleChange(idx, 'forma', e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-lg bg-white text-sm bg-gray-50 focus:bg-white"
                            >
                                <option>Redondo</option>
                                <option>Cuadrado</option>
                                <option>Rectangular</option>
                                <option>Corazón</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase">Sabor</label>
                            <select
                                value={comp.sabor}
                                onChange={(e) => handleChange(idx, 'sabor', e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-lg bg-white text-sm bg-gray-50 focus:bg-white"
                            >
                                <option value="">Original / Vacio</option>
                                {flavors.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase">Relleno</label>
                            <select
                                value={comp.relleno}
                                onChange={(e) => handleChange(idx, 'relleno', e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-lg bg-white text-sm bg-gray-50 focus:bg-white"
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
                                value={comp.descripcion}
                                onChange={(e) => handleChange(idx, 'descripcion', e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-lg text-sm bg-gray-50 focus:bg-white"
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