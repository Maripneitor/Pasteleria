import React, { useState } from 'react';
import { Sparkles, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';
import client from '../../config/axios';
import { useOrder } from '../../context/OrderContext';
import toast from 'react-hot-toast';

const AIDraftPanel = () => {
    const { updateOrder } = useOrder();
    const [prompt, setPrompt] = useState('');
    const [loading, setLoading] = useState(false);
    const [suggestion, setSuggestion] = useState(null);

    const handleGenerate = async () => {
        if (!prompt.trim()) return;

        setLoading(true);
        setSuggestion(null);

        try {
            // Llama al endpoint de IA (simulado o real)
            const res = await client.post('/ai/draft', { prompt });
            const { draft, missing, nextQuestion, mode, warning } = res.data;

            if (draft) {
                updateOrder(draft);
                if (mode === 'fallback') {
                    toast('Modo Offline: Verifique los datos extraídos', { icon: '⚠️' });
                } else {
                    toast.success("Borrador aplicado al formulario");
                }
            }

            if (warning) {
                setSuggestion(warning);
            } else if (missing && missing.length > 0) {
                setSuggestion(nextQuestion || `Falta información: ${missing.join(', ')}`);
            } else {
                setSuggestion(null);
            }
        } catch (error) {
            console.error("AI Draft Error:", error);
            toast.error("Error al procesar con IA");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto mb-6 px-6">
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100 rounded-2xl p-6 shadow-sm">
                <div className="flex items-start gap-4">
                    <div className="bg-white p-3 rounded-full shadow-sm text-purple-600">
                        <Sparkles size={24} />
                    </div>

                    <div className="flex-1 space-y-4">
                        <div>
                            <h3 className="font-bold text-purple-900 text-lg">Asistente de Pedidos IA</h3>
                            <p className="text-purple-700 text-sm">
                                Describe el pedido en lenguaje natural y deja que la IA llene el formulario por ti.
                            </p>
                        </div>

                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="Ej: Pastel de chocolate para 20 personas, relleno de fresa, para el sábado a las 4pm. Cliente Juan Pérez..."
                            className="w-full p-4 rounded-xl border-purple-100 focus:ring-2 focus:ring-purple-400 focus:border-transparent outline-none text-gray-700 placeholder-purple-300 bg-white shadow-sm resize-none h-24"
                            disabled={loading}
                        />

                        {suggestion && (
                            <div className="bg-yellow-50 text-yellow-800 p-3 rounded-lg text-sm flex items-start gap-2 animate-in fade-in slide-in-from-top-2">
                                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                                <span>{suggestion}</span>
                            </div>
                        )}

                        <div className="flex justify-end">
                            <button
                                onClick={handleGenerate}
                                disabled={loading || !prompt.trim()}
                                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2.5 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-purple-200 active:scale-95"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 size={18} className="animate-spin" />
                                        Analizando...
                                    </>
                                ) : (
                                    <>
                                        Generar Borrador <ArrowRight size={18} />
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AIDraftPanel;
