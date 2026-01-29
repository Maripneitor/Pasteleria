import React, { useState, useEffect } from 'react';
import { useOrder } from '../../context/OrderContext';
import { Cake, FileText, Loader2 } from 'lucide-react';
import api from '../../config/axios';
import toast from 'react-hot-toast';

const StepProduct = () => {
    const { orderData, updateOrder, nextStep, prevStep } = useOrder();
    const [flavors, setFlavors] = useState([]);
    const [fillings, setFillings] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCatalogs = async () => {
            try {
                const [fRes, fiRes] = await Promise.all([
                    api.get('/catalog/flavors'),
                    api.get('/catalog/fillings')
                ]);
                setFlavors(fRes.data);
                setFillings(fiRes.data);
            } catch (error) {
                console.error("Error fetching catalogs", error);
                toast.error("Error cargando catálogos");
            } finally {
                setLoading(false);
            }
        };
        fetchCatalogs();
    }, []);

    const types = ["Sencillo", "Doble Altura", "2 Pisos", "3 Pisos"];

    // Helper to update product inside orderData array (assuming single product for MVP)
    const handleProductChange = (field, value) => {
        // En nuestro modelo `Folio` simple actual, estos campos se mapean directamente en el payload final
        // Pero el Context usa un array `products`. Vamos a mantener la estructura del context
        // y en StepPayment haremos el aplanamiento (flattening) para enviar al backend.
        const currentProduct = orderData.products?.[0] || {};
        const updatedProduct = { ...currentProduct, [field]: value };
        updateOrder({ products: [updatedProduct] });
    };

    const product = orderData.products?.[0] || {};
    const isValid = product.type && product.flavorId && product.fillingId;

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-pink-500" /></div>;

    return (
        <div className="space-y-6 fade-in">
            <h2 className="text-2xl font-bold text-gray-800">Detalles del Pastel</h2>

            <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-700">Tipo de Pastel</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {types.map(type => (
                        <button
                            key={type}
                            onClick={() => handleProductChange('type', type)}
                            className={`p-3 rounded-xl border transition ${product.type === type
                                    ? 'bg-pink-50 border-pink-500 text-pink-700 font-bold ring-2 ring-pink-200'
                                    : 'border-gray-200 hover:border-pink-300'
                                }`}
                        >
                            {type}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Sabor de Pan</label>
                    <select
                        value={product.flavorId || ''}
                        onChange={(e) => handleProductChange('flavorId', e.target.value)}
                        className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 outline-none bg-white"
                        size={5} // Listbox style
                    >
                        {flavors.map(f => (
                            <option key={f.id} value={f.id} className="p-2 hover:bg-pink-50 cursor-pointer rounded">
                                {f.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Relleno</label>
                    <select
                        value={product.fillingId || ''}
                        onChange={(e) => handleProductChange('fillingId', e.target.value)}
                        className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 outline-none bg-white"
                        size={5}
                    >
                        {fillings.map(f => (
                            <option key={f.id} value={f.id} className="p-2 hover:bg-pink-50 cursor-pointer rounded">
                                {f.name}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Descripción / Diseño</label>
                <div className="relative">
                    <FileText className="absolute left-3 top-3 text-gray-400" size={20} />
                    <textarea
                        value={product.design || ''}
                        onChange={(e) => handleProductChange('design', e.target.value)}
                        placeholder="Ej: Decoración de Frozen, escribir 'Felicidades Ana', colores azul y plata..."
                        className="w-full pl-10 p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 outline-none h-32"
                    />
                </div>
            </div>

            <div className="flex justify-between pt-4">
                <button onClick={prevStep} className="px-6 py-3 text-gray-600 font-medium hover:bg-gray-100 rounded-xl">
                    Atrás
                </button>
                <button
                    onClick={nextStep}
                    disabled={!isValid}
                    className="bg-pink-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg shadow-pink-200"
                >
                    Siguiente
                </button>
            </div>
        </div>
    );
};

export default StepProduct;
