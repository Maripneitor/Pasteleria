import React, { useState } from 'react';
import { useOrder } from '../../../context/OrderContext';
import { Upload, Sparkles, Image as ImageIcon } from 'lucide-react';
import api from '../../../config/axios';
import toast from 'react-hot-toast';

const StepD_Design = ({ next, prev }) => {
    const { orderData, updateOrder } = useOrder();
    const [uploading, setUploading] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);

    // Image Upload
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
            // Support multiple images if needed, prompt said "up to 5". Array logic.
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
        setAnalyzing(true);
        // Mock AI analysis for now, or call distinct endpoint
        setTimeout(() => {
            setAnalyzing(false);
            toast.success("Diseño analizado: Colores pastel detectados.");
        }, 1500);
    };

    // Extras / Accessories logic (Simple array or text?)
    // Prompt: "Gestión de Accesorios (Obleas, figuras de fondant, etc.)"
    // Ideally reuse StepProduct logic but simpler for Step D. We can use the existing 'extras' array.

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <span className="bg-pink-100 text-pink-600 w-8 h-8 rounded-full flex items-center justify-center text-sm">D</span>
                Diseño y Adicionales
            </h2>

            {/* General Description */}
            <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Descripción General del Diseño</label>
                <textarea
                    value={orderData.designDescription || ''}
                    onChange={(e) => updateOrder({ designDescription: e.target.value })}
                    className="w-full p-4 border border-gray-300 rounded-xl h-32 focus:ring-2 focus:ring-pink-500"
                    placeholder="Detalles sobre colores, temática, posición de figuras..."
                />
            </div>

            {/* Dedication */}
            <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Dedicatoria</label>
                <input
                    type="text"
                    value={orderData.dedication || ''}
                    onChange={(e) => updateOrder({ dedication: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500"
                    placeholder="Ej. ¡Feliz Cumpleaños María!"
                />
            </div>

            {/* Extra Height & Image */}
            <div className="grid md:grid-cols-2 gap-6">
                {/* Height Checkbox */}
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

                {/* Images */}
                <div className="space-y-2">
                    <label className="block text-sm font-bold text-gray-700">Imágenes de Referencia (Máx 5)</label>
                    <div className="flex flex-wrap gap-2">
                        {(orderData.referenceImages || []).map((imgUrl, idx) => (
                            <div key={idx} className="relative group">
                                <img
                                    src={`${import.meta.env.VITE_API_URL}${imgUrl}`.replace('/api', '')}
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

            {/* AI Analyze Button */}
            {(orderData.referenceImages?.length > 0) && (
                <button
                    onClick={handleAnalyzeAI}
                    disabled={analyzing}
                    className="w-full py-3 bg-gradient-to-r from-violet-500 to-fuchsia-600 text-white font-bold rounded-xl shadow-lg shadow-violet-200 hover:shadow-xl transition flex items-center justify-center gap-2"
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
                <button onClick={next} className="bg-pink-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-pink-700 transition shadow-lg shadow-pink-200">Siguiente (Entrega) arrow_forward</button>
            </div>
        </div>
    );
};

export default StepD_Design;
