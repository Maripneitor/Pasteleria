import React, { useState } from 'react';
import { useOrder } from '@/context/OrderContext';
import { Upload, Sparkles, Image as ImageIcon, Trash2, Loader2, PlusCircle } from 'lucide-react';
import api from '@/config/axios';
import toast from 'react-hot-toast';

const StepD_Design = ({ next, prev }) => {
    const { orderData, updateOrder } = useOrder();
    const [uploading, setUploading] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('image', file);

        setUploading(true);
        const toastId = toast.loading('Subiendo imagen...');
        try {
            const res = await api.post('/upload/reference', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            const currentImages = orderData.referenceImages || [];
            if (currentImages.length >= 5) {
                toast.error('Máximo 5 imágenes permitidas', { id: toastId });
                return;
            }
            updateOrder({ referenceImages: [...currentImages, res.data.url] });
            toast.success('Imagen subida', { id: toastId });
        } catch (error) {
            console.error(error);
            toast.error('Error al subir', { id: toastId });
        } finally {
            setUploading(false);
        }
    };

    const removeImage = (index) => {
        const newImages = orderData.referenceImages.filter((_, i) => i !== index);
        updateOrder({ referenceImages: newImages });
    };

    const handleAnalyzeAI = async () => {
        if (!orderData.referenceImages || orderData.referenceImages.length === 0) return;
        
        setAnalyzing(true);
        const toastId = toast.loading('Analizando diseño con IA (Visual)...');
        try {
            const imageUrl = orderData.referenceImages[0];
            const { data } = await api.post('/ai-draft/analyze-image', { imageUrl });
            
            const currentDesc = orderData.descripcion_diseno || '';
            const newDesc = currentDesc 
                ? `${currentDesc}\n\n[Análisis IA]: ${data.description}`
                : `[Análisis IA]: ${data.description}`;
                
            updateOrder({ descripcion_diseno: newDesc });
            toast.success("¡Diseño analizado exitosamente!", { id: toastId });
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || "Error al analizar la imagen con IA", { id: toastId });
        } finally {
            setAnalyzing(false);
        }
    };

    // 🔥 NUEVA LÓGICA DE EXTRAS / ACCESORIOS
    const extras = orderData.extras || [];

    const addExtra = () => {
        updateOrder({ extras: [...extras, { nombre: '', cantidad: 1, precio: '' }] });
    };

    const updateExtra = (index, field, value) => {
        const newExtras = [...extras];
        newExtras[index][field] = value;
        updateOrder({ extras: newExtras });
    };

    const removeExtra = (index) => {
        const newExtras = extras.filter((_, i) => i !== index);
        updateOrder({ extras: newExtras });
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <span className="bg-pink-100 text-pink-600 w-8 h-8 rounded-full flex items-center justify-center text-sm">D</span>
                Diseño y Adicionales
            </h2>

            <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Descripción General del Diseño</label>
                <textarea
                    value={orderData.descripcion_diseno || ''}
                    onChange={(e) => updateOrder({ descripcion_diseno: e.target.value })}
                    className="w-full p-4 border border-gray-300 rounded-xl h-32 focus:ring-2 focus:ring-pink-500"
                    placeholder="Detalles sobre colores, temática, posición de figuras..."
                />
            </div>

            <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Dedicatoria</label>
                <input
                    type="text"
                    value={orderData.dedicatoria || ''}
                    onChange={(e) => updateOrder({ dedicatoria: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500"
                    placeholder="Ej. ¡Feliz Cumpleaños María!"
                />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-purple-50 p-4 rounded-xl border border-purple-100 flex items-center gap-3">
                    <input
                        type="checkbox"
                        id="extraHeight"
                        checked={orderData.extraHeight || false}
                        onChange={(e) => updateOrder({ extraHeight: e.target.checked })}
                        className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500 border-gray-300"
                    />
                    <div>
                        <label htmlFor="extraHeight" className="font-bold text-purple-900 cursor-pointer">¿Lleva Altura Extra?</label>
                        <p className="text-xs text-purple-700">Mayor complejidad y precio.</p>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="block text-sm font-bold text-gray-700">Imágenes de Referencia (Máx 5)</label>
                    <div className="flex flex-wrap gap-2">
                        {(orderData.referenceImages || []).map((imgUrl, idx) => (
                            <div key={idx} className="relative group">
                                <img
                                    src={imgUrl.startsWith('http') ? imgUrl : `${import.meta.env.VITE_API_URL}${imgUrl}`.replace('/api', '')}
                                    className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                                    alt="ref"
                                />
                                <button
                                    onClick={() => removeImage(idx)}
                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition shadow-sm"
                                >
                                    <Trash2 size={12} />
                                </button>
                            </div>
                        ))}

                        {(orderData.referenceImages?.length || 0) < 5 && (
                            <label className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition text-gray-400 hover:text-pink-500">
                                {uploading ? <Loader2 className="animate-spin" size={20} /> : <Upload size={20} />}
                                <span className="text-[10px] mt-1">Subir</span>
                                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
                            </label>
                        )}
                    </div>
                </div>
            </div>

            {/* 🔥 SECCIÓN DE ACCESORIOS Y EXTRAS */}
            <div className="pt-6 border-t border-gray-200 mt-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-gray-800">Accesorios y Extras (Cobro Adicional)</h3>
                    <button type="button" onClick={addExtra} className="text-sm bg-pink-100 text-pink-700 px-3 py-1.5 rounded-lg font-bold hover:bg-pink-200 transition flex items-center gap-1">
                        <PlusCircle size={16} /> Agregar Extra
                    </button>
                </div>
                
                {extras.length === 0 ? (
                    <p className="text-sm text-gray-400 italic">No hay accesorios adicionales. (Ej. Velas, Toppers, Obleas)</p>
                ) : (
                    <div className="space-y-3">
                        {extras.map((extra, idx) => (
                            <div key={idx} className="flex flex-wrap md:flex-nowrap gap-3 items-center bg-gray-50 p-3 rounded-xl border border-gray-200 animate-in fade-in">
                                <input
                                    type="text"
                                    placeholder="Nombre (Ej. Vela Chispera)"
                                    value={extra.nombre || ''}
                                    onChange={(e) => updateExtra(idx, 'nombre', e.target.value)}
                                    className="flex-1 p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-pink-500 outline-none"
                                />
                                <div className="w-24">
                                    <input
                                        type="number"
                                        placeholder="Cant."
                                        value={extra.cantidad}
                                        onChange={(e) => updateExtra(idx, 'cantidad', parseInt(e.target.value) || 1)}
                                        className="w-full p-2 border border-gray-300 rounded-lg text-sm text-center focus:ring-2 focus:ring-pink-500 outline-none"
                                    />
                                </div>
                                <div className="w-32 relative">
                                    <span className="absolute left-3 top-2.5 text-green-700 font-bold">$</span>
                                    <input
                                        type="number"
                                        placeholder="Precio"
                                        value={extra.precio}
                                        onChange={(e) => updateExtra(idx, 'precio', parseFloat(e.target.value) || 0)}
                                        className="w-full pl-7 p-2 border border-green-300 bg-green-50 text-green-700 font-bold rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none"
                                    />
                                </div>
                                <button type="button" onClick={() => removeExtra(idx)} className="p-2 text-red-500 hover:bg-red-100 rounded-lg transition">
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {(orderData.referenceImages?.length > 0) && (
                <button
                    onClick={handleAnalyzeAI}
                    disabled={analyzing}
                    className="w-full py-3 bg-gradient-to-r from-violet-500 to-fuchsia-600 text-white font-bold rounded-xl shadow-lg shadow-violet-200 hover:shadow-xl transition flex items-center justify-center gap-2 mt-4"
                >
                    {analyzing ? (
                        <> <Loader2 className="animate-spin" /> Analizando Diseño... </>
                    ) : (
                        <> <Sparkles size={18} /> Analizar Diseño con IA </>
                    )}
                </button>
            )}

            <div className="flex justify-between pt-6">
                <button onClick={prev} className="px-6 py-3 text-gray-600 font-bold hover:bg-gray-100 rounded-xl transition">Atrás</button>
                <button onClick={next} className="bg-pink-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-pink-700 transition shadow-lg shadow-pink-200">Siguiente</button>
            </div>
        </div>
    );
};

export default StepD_Design;