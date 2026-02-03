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

    // ATOMIC UPDATE HELPER (Fixes race condition)
    const patchProduct = (patch) => {
        updateOrder(prev => {
            const currentProduct = prev.products?.[0] || {};
            const updatedProduct = { ...currentProduct, ...patch };
            return { ...prev, products: [updatedProduct] };
        });
    };

    // Generic handler for single fields (wraps patchProduct)
    const handleProductChange = (field, value) => {
        patchProduct({ [field]: value });
    };

    const product = orderData.products?.[0] || {};
    // Fix: Use correct state keys (flavorId, fillingId)
    const isValid = product.type && product.flavorId && product.fillingId;

    // Toggle handler for Base Cake
    const isBaseCake = orderData.tipo_folio === 'Base';

    const handleBaseToggle = (isBase) => {
        updateOrder({
            tipo_folio: isBase ? 'Base' : 'Normal',
            isBaseCake: isBase
        });
    };

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-pink-500" /></div>;

    return (
        <div className="space-y-8 fade-in">
            {/* Header & Toggle */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h2 className="text-2xl font-bold text-gray-800">Detalles del Pastel</h2>

                <div className="bg-gray-100 p-1 rounded-xl flex items-center">
                    <button
                        onClick={() => handleBaseToggle(false)}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${!isBaseCake ? 'bg-white text-pink-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        Pastel Normal
                    </button>
                    <button
                        onClick={() => handleBaseToggle(true)}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${isBaseCake ? 'bg-white text-pink-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        Pastel Base (Insumo)
                    </button>
                </div>
            </div>

            <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-700">Tipo de Altura / Pisos</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {types.map(type => (
                        <button
                            key={type}
                            onClick={() => handleProductChange('type', type)}
                            className={`p-4 rounded-xl border transition-all duration-200 ${product.type === type
                                ? 'bg-pink-50 border-pink-500 text-pink-700 font-bold ring-2 ring-pink-200 shadow-sm'
                                : 'border-gray-200 hover:border-pink-300 hover:shadow-sm bg-white'
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
                    {flavors.length === 0 ? (
                        <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl text-center">
                            <Cake className="mx-auto text-gray-400 mb-2" size={24} />
                            <p className="text-sm text-gray-500">No hay sabores activos.</p>
                        </div>
                    ) : (
                        <select
                            value={product.flavorId || ''}
                            onChange={(e) => {
                                const id = Number(e.target.value);
                                const name = flavors.find(f => f.id === id)?.name || '';
                                patchProduct({ flavorId: id, flavorName: name });
                            }}
                            className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 outline-none bg-white"
                            size={5}
                        >
                            {flavors.map(f => (
                                <option key={f.id} value={f.id} className="p-2 hover:bg-pink-50 cursor-pointer rounded">
                                    {f.name}
                                </option>
                            ))}
                        </select>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Relleno</label>
                    {fillings.length === 0 ? (
                        <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl text-center">
                            <Loader2 className="mx-auto text-gray-400 mb-2" size={24} />
                            <p className="text-sm text-gray-500">No hay rellenos activos.</p>
                        </div>
                    ) : (
                        <select
                            value={product.fillingId || ''}
                            onChange={(e) => {
                                const id = Number(e.target.value);
                                const name = fillings.find(f => f.id === id)?.name || '';
                                patchProduct({ fillingId: id, fillingName: name });
                            }}
                            className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 outline-none bg-white"
                            size={5}
                        >
                            {fillings.map(f => (
                                <option key={f.id} value={f.id} className="p-2 hover:bg-pink-50 cursor-pointer rounded">
                                    {f.name}
                                </option>
                            ))}
                        </select>
                    )}
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

            {/* Reference Images Upload */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Imagen de Referencia</label>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:bg-gray-50 transition-colors">
                    <input
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                            const file = e.target.files[0];
                            if (!file) return;

                            const formData = new FormData();
                            formData.append('image', file);

                            const toastId = toast.loading('Subiendo imagen...');
                            try {
                                const res = await api.post('/upload/reference', formData, {
                                    headers: { 'Content-Type': 'multipart/form-data' }
                                });
                                handleProductChange('referenceImageUrl', res.data.url);
                                toast.success('Imagen subida correctamente', { id: toastId });
                            } catch (error) {
                                console.error(error);
                                toast.error('Error al subir imagen', { id: toastId });
                            }
                        }}
                        className="block w-full text-sm text-gray-500
                            file:mr-4 file:py-2 file:px-4
                            file:rounded-full file:border-0
                            file:text-sm file:font-semibold
                            file:bg-pink-50 file:text-pink-700
                            hover:file:bg-pink-100
                        "
                    />
                    <p className="mt-2 text-xs text-gray-500">Sube una foto de referencia si la tienes</p>
                </div>
                {product.referenceImageUrl && (
                    <div className="mt-4 relative inline-block">
                        <img
                            src={`${import.meta.env.VITE_API_URL}${product.referenceImageUrl}`.replace('/api', '')}
                            alt="Referencia"
                            className="h-32 w-32 object-cover rounded-lg border border-gray-200 shadow-sm"
                        />
                        <button
                            onClick={() => handleProductChange('referenceImageUrl', null)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow hover:bg-red-600"
                        >
                            ✕
                        </button>
                    </div>
                )}
            </div>

            <div className="flex flex-col items-end gap-2">
                <span className="text-xs text-red-500 font-medium">
                    {!isValid && (
                        <>
                            Faltan: {' '}
                            {!product.type && <span className="mr-1">• Altura</span>}
                            {!product.flavorId && <span className="mr-1">• Sabor</span>}
                            {!product.fillingId && <span>• Relleno</span>}
                        </>
                    )}
                </span>
                <div className="flex gap-4">
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
        </div>
    );
};

export default StepProduct;
