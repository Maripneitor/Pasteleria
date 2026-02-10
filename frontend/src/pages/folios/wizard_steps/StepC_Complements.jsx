import React, { useState, useEffect } from 'react';
import { useOrder } from '../../../context/OrderContext';
import { PlusCircle, Trash2 } from 'lucide-react';
import catalogApi from '../../../services/catalogApi';

const StepC_Complements = ({ next, prev }) => {
    const { orderData, updateOrder } = useOrder();
    const [flavors, setFlavors] = useState([]);
    const [fillings, setFillings] = useState([]);

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

    const addComplement = () => {
        const newComps = [...(orderData.complements || []), {
            personas: 10,
            forma: 'Redondo',
            sabor: '',
            relleno: '',
            descripcion: '',
            precio: 0
        }];
        updateOrder({ complements: newComps });
    };

    const removeComplement = (index) => {
        const newComps = orderData.complements.filter((_, i) => i !== index);
        updateOrder({ complements: newComps });
    };

    const updateComplement = (index, field, value) => {
        const newComps = [...orderData.complements];
        newComps[index][field] = value;
        updateOrder({ complements: newComps });
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <span className="bg-pink-100 text-pink-600 w-8 h-8 rounded-full flex items-center justify-center text-sm">C</span>
                Pasteles Complementarios (Opcional)
            </h2>
            <p className="text-gray-500 text-sm">Agrega pasteles adicionales si el pedido incluye más de una pieza.</p>

            {(orderData.complements || []).map((comp, idx) => (
                <div key={idx} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm relative animate-in fade-in slide-in-from-bottom-2">
                    <button
                        onClick={() => removeComplement(idx)}
                        className="absolute top-3 right-3 text-gray-400 hover:text-red-500 p-1 transition"
                    >
                        <Trash2 size={18} />
                    </button>

                    <div className="grid md:grid-cols-4 gap-4 mb-3">
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase">Personas</label>
                            <input
                                type="number"
                                value={comp.personas}
                                onChange={(e) => updateComplement(idx, 'personas', e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-pink-500"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase">Forma</label>
                            <select
                                value={comp.forma}
                                onChange={(e) => updateComplement(idx, 'forma', e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-lg bg-white"
                            >
                                <option>Redondo</option>
                                <option>Cuadrado</option>
                                <option>Rectangular</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase">Sabor</label>
                            <select
                                value={comp.sabor}
                                onChange={(e) => updateComplement(idx, 'sabor', e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-lg bg-white"
                            >
                                <option value="">Original</option>
                                {flavors.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase">Relleno</label>
                            <select
                                value={comp.relleno}
                                onChange={(e) => updateComplement(idx, 'relleno', e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-lg bg-white"
                            >
                                <option value="">Original</option>
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
                                onChange={(e) => updateComplement(idx, 'descripcion', e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-lg"
                                placeholder="Ej. Encima del principal, mismo color..."
                            />
                        </div>
                    </div>
                </div>
            ))}

            <button
                onClick={addComplement}
                className="w-full py-4 border-2 border-dashed border-pink-200 rounded-2xl text-pink-600 font-bold hover:bg-pink-50 hover:border-pink-300 transition flex items-center justify-center gap-2"
            >
                <PlusCircle size={20} /> Añadir Pastel Complementario
            </button>

            <div className="flex justify-between pt-6">
                <button
                    onClick={prev}
                    className="px-6 py-3 text-gray-600 font-bold hover:bg-gray-100 rounded-xl transition"
                >
                    Atrás
                </button>
                <button
                    onClick={next}
                    className="bg-pink-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-pink-700 transition shadow-lg shadow-pink-200"
                >
                    Siguiente (Diseño) arrow_forward
                </button>
            </div>
        </div>
    );
};

export default StepC_Complements;
