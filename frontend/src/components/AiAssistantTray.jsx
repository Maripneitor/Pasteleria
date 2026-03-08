import { useState, useEffect, useRef } from "react";
import { Bot, X, Send, Sparkles, Loader2, AlertCircle, Mic, MicOff, History, Trash2, PlusCircle, Edit3, Search, BarChart3 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import aiService from '../services/aiService';
import toast from 'react-hot-toast';
import useDictation from '../hooks/useDictation';

import { useOrder } from '../context/OrderContext';

const AiAssistantTray = ({ isOpen, onClose }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const messagesEndRef = useRef(null);

    let updateOrder = null;
    try {
        const orderContext = useOrder();
        updateOrder = orderContext?.updateOrder;
    } catch (e) {}

    const [mode, setMode] = useState('CREATE'); // CREATE | EDIT | SEARCH | INSIGHTS

    const [messages, setMessages] = useState([
        { role: 'ai', text: '¡Hola! Soy tu asistente de pastelería. ¿En qué te ayudo hoy?', mode: 'CREATE' }
    ]);
    const [input, setInput] = useState('');
    const [isThinking, setIsThinking] = useState(false);
    const [error, setError] = useState(null);
    const [showHistory, setShowHistory] = useState(false);
    const [sessions, setSessions] = useState([]);

    useEffect(() => {
        loadSessions();
    }, []);

    const loadSessions = async () => {
        const data = await aiService.getSessions();
        if (data) setSessions(data);
    };

    const handleDeleteSession = async (id, e) => {
        e.stopPropagation();
        if (window.confirm('¿Eliminar esta conversación?')) {
            await aiService.deleteSession(id);
            setSessions(prev => prev.filter(s => s.id !== id));
        }
    };

    const handleLoadSession = (session) => {
        if (session.extractedData && updateOrder) {
            const cleanDraft = Object.fromEntries(
                Object.entries(session.extractedData).filter(([_, v]) => v != null)
            );
            updateOrder(cleanDraft);
            toast.success("Sesión recuperada");

            const aiText = `He recuperado el pedido para ${session.extractedData.cliente_nombre || 'el cliente'}.`;
            setMessages(prev => [...prev, { role: 'ai', text: aiText }]);
        }
        setShowHistory(false);
    };

    const { isListening, transcript, startListening, stopListening, resetTranscript, error: dictationError } = useDictation();

    useEffect(() => {
        if (dictationError) {
            setError(dictationError);
            setTimeout(() => setError(null), 5000);
        }
    }, [dictationError]);

    useEffect(() => {
        if (transcript) {
            setInput(transcript);
        }
    }, [transcript]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isThinking]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim() || isThinking) return;

        const userMessage = input;

        if (updateOrder) {
            updateOrder(prev => ({
                ...prev,
                draftTranscriptRaw: (prev.draftTranscriptRaw || '') + '\n- ' + userMessage
            }));
        }

        setMessages(prev => [...prev, { role: 'user', text: userMessage, mode }]);
        setInput('');
        resetTranscript();
        setIsThinking(true);
        setError(null);

        try {
            let response;
            switch (mode) {
                case 'CREATE':
                    response = await aiService.createOrderWithAI(userMessage);

                    if (response.isPartial) {
                        setMessages(prev => [...prev, {
                            role: 'ai',
                            text: response.message || 'Entiendo, ¿podrías darme más detalles?',
                            mode: 'CREATE',
                            extractedData: response.extractedData
                        }]);
                    } else {
                        setMessages(prev => [...prev, {
                            role: 'ai',
                            text: response.aiConfirmation || '¡Pedido creado exitosamente!',
                            mode: 'CREATE',
                            orderData: response.folio,
                            folioNumber: response.folioNumber,
                            extractedData: response.extractedData
                        }]);
                    }

                    if (response.extractedData && updateOrder) {
                        const cleanDraft = Object.fromEntries(
                            Object.entries(response.extractedData).filter(([_, v]) => v != null)
                        );
                        updateOrder(prev => ({ ...prev, ...cleanDraft }));
                        if (!response.isPartial) toast.success("Pedido registrado");
                        else toast.success("Borrador actualizado con IA");
                    }

                    loadSessions();
                    break;

                case 'EDIT':
                    const orderIdMatch = userMessage.match(/\b(\d+)\b/);
                    const orderId = orderIdMatch ? parseInt(orderIdMatch[1]) : null;

                    if (!orderId) {
                        setMessages(prev => [...prev, {
                            role: 'ai',
                            text: '❓ No detecté el ID del pedido. Por favor menciona el número de pedido (ej: "pedido 123 cambiar fecha al martes")',
                            mode: 'EDIT',
                            isError: true
                        }]);
                        break;
                    }

                    response = await aiService.editOrderWithAI(orderId, userMessage);

                    setMessages(prev => [...prev, {
                        role: 'ai',
                        text: response.aiConfirmation || 'Pedido actualizado',
                        mode: 'EDIT',
                        changes: response.changes,
                        changedFields: response.changedFields,
                        order: response.order
                    }]);
                    break;

                case 'SEARCH':
                    response = await aiService.searchOrdersWithAI(userMessage);
                    setMessages(prev => [...prev, {
                        role: 'ai',
                        text: response.aiSummary || `Encontré ${response.count} resultados`,
                        mode: 'SEARCH',
                        results: response.results,
                        count: response.count,
                        totalValue: response.totalValue,
                        filters: response.filters
                    }]);
                    break;

                case 'INSIGHTS':
                    response = await aiService.getDashboardInsights(userMessage);
                    setMessages(prev => [...prev, {
                        role: 'ai',
                        text: response.insight || 'Análisis completado',
                        mode: 'INSIGHTS',
                        dashboardData: response.dashboardData,
                        question: response.question
                    }]);
                    break;
            }

        } catch (err) {
            console.error('Error en IA:', err);
            const errorMsg = err.response?.data?.message || err.message || 'Error al procesar';

            setMessages(prev => [...prev, {
                role: 'ai',
                text: `❌ ${errorMsg}`,
                mode,
                isError: true
            }]);

            if (mode === 'CREATE') {
                try {
                    const fallbackResponse = await aiService.parseOrderIntent(userMessage);
                    if (fallbackResponse.assistant_response) {
                        setMessages(prev => [...prev, {
                            role: 'ai',
                            text: fallbackResponse.assistant_response,
                            mode: 'CREATE',
                            draft: fallbackResponse.draft
                        }]);

                        if (fallbackResponse.draft && updateOrder) {
                            updateOrder(fallbackResponse.draft);
                        }
                    }
                } catch (fallbackErr) {
                    console.error('Fallback también falló:', fallbackErr);
                }
            }
        } finally {
            setIsThinking(false);
        }
    };

    const getPlaceholder = () => {
        switch (mode) {
            case 'CREATE': return 'Ej: Pastel de chocolate para María...';
            case 'EDIT': return 'Ej: Pedido 123 cambiar fecha al martes';
            case 'SEARCH': return 'Ej: pedidos de esta semana > 800 pesos';
            case 'INSIGHTS': return 'Ej: ¿Cuánto hemos vendido este mes?';
            default: return 'Escribe tu mensaje...';
        }
    };

    const renderMessageExtras = (msg) => {
        if (!msg.mode || msg.isError) return null;

        switch (msg.mode) {
            case 'CREATE':
                if (msg.orderData) {
                    return (
                        <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                            <h4 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
                                <PlusCircle size={16} /> Pedido Creado: {msg.folioNumber}
                            </h4>
                            <div className="text-sm space-y-1 text-gray-700">
                                <p><strong>Cliente:</strong> {msg.orderData.cliente_nombre}</p>
                                <p><strong>Total:</strong> ${msg.orderData.total}</p>
                            </div>
                            <button
                                onClick={() => { navigate(`/pedidos/${msg.orderData.id}`); onClose(); }}
                                className="mt-2 w-full py-1.5 bg-green-600 text-white rounded hover:bg-green-700 text-sm transition"
                            > Ver Pedido Completo </button>
                        </div>
                    );
                }
                break;
            case 'EDIT':
                if (msg.changedFields && msg.changedFields.length > 0) {
                    return (
                        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                                <Edit3 size={16} /> Cambios Aplicados
                            </h4>
                            <ul className="text-sm space-y-1 text-gray-700 list-disc list-inside">
                                {msg.changedFields.map((field, idx) => <li key={idx}>{field}</li>)}
                            </ul>
                            {msg.order && (
                                <button
                                    onClick={() => { navigate(`/pedidos/${msg.order.id}`); onClose(); }}
                                    className="mt-2 w-full py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm transition"
                                > Ver Pedido </button>
                            )}
                        </div>
                    );
                }
                break;
            case 'SEARCH':
                if (msg.results && msg.results.length > 0) {
                    return (
                        <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <h4 className="font-semibold text-yellow-800 mb-2 flex items-center gap-2">
                                <Search size={16} /> {msg.count} Resultados
                            </h4>
                            <div className="space-y-2 max-h-60 overflow-y-auto">
                                {msg.results.slice(0, 10).map((order) => (
                                    <div key={order.id} onClick={() => { navigate(`/pedidos/${order.id}`); onClose(); }} className="block p-2 bg-white rounded border hover:border-yellow-400 transition cursor-pointer">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-semibold text-sm">{order.folioNumber}</p>
                                                <p className="text-xs text-gray-600">{order.cliente}</p>
                                            </div>
                                            <span className="text-sm font-bold text-green-600">${order.total}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                }
                break;
            case 'INSIGHTS':
                if (msg.dashboardData) {
                    return (
                        <div className="mt-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                            <h4 className="font-semibold text-purple-800 mb-2 flex items-center gap-2">
                                <BarChart3 size={16} /> Datos del Dashboard
                            </h4>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className="p-2 bg-white rounded"><p className="text-gray-500">Total Pedidos</p><p className="font-bold text-lg">{msg.dashboardData.totalOrders}</p></div>
                                <div className="p-2 bg-white rounded"><p className="text-gray-500">Ingresos Mes</p><p className="font-bold text-green-600">${msg.dashboardData.monthRevenue}</p></div>
                            </div>
                        </div>
                    );
                }
                break;
        }
        return null;
    };

    return (
        <>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }}
                        className="fixed bottom-4 right-4 w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden flex flex-col" style={{ maxHeight: '80vh' }}
                    >
                        <div className="bg-gradient-to-r from-pink-500 to-rose-500 p-4 flex justify-between items-center text-white">
                            <div className="flex items-center gap-2"><Bot size={20} /><span className="font-medium">Asistente IA</span></div>
                            <div className="flex items-center gap-2">
                                <button onClick={() => setShowHistory(!showHistory)} className="p-1 hover:bg-white/20 rounded transition" title="Historial"><History size={18} /></button>
                                <button onClick={onClose} className="p-1 hover:bg-white/20 rounded transition"><X size={18} /></button>
                            </div>
                        </div>

                        <div className="flex gap-1 p-2 border-b bg-gray-50">
                            <button onClick={() => setMode('CREATE')} className={`flex-1 py-2 px-2 rounded text-xs font-medium flex items-center justify-center gap-1 ${mode === 'CREATE' ? 'bg-pink-500 text-white shadow' : 'bg-white text-gray-700'}`}><PlusCircle size={14} /> Crear</button>
                            <button onClick={() => setMode('EDIT')} className={`flex-1 py-2 px-2 rounded text-xs font-medium flex items-center justify-center gap-1 ${mode === 'EDIT' ? 'bg-blue-500 text-white shadow' : 'bg-white text-gray-700'}`}><Edit3 size={14} /> Editar</button>
                            <button onClick={() => setMode('SEARCH')} className={`flex-1 py-2 px-2 rounded text-xs font-medium flex items-center justify-center gap-1 ${mode === 'SEARCH' ? 'bg-green-500 text-white shadow' : 'bg-white text-gray-700'}`}><Search size={14} /> Buscar</button>
                            <button onClick={() => setMode('INSIGHTS')} className={`flex-1 py-2 px-2 rounded text-xs font-medium flex items-center justify-center gap-1 ${mode === 'INSIGHTS' ? 'bg-purple-500 text-white shadow' : 'bg-white text-gray-700'}`}><BarChart3 size={14} /> Insights</button>
                        </div>

                        <div className="flex-1 bg-gray-50 overflow-hidden relative flex">
                            {/* Chat Area */}
                            <div className="flex-1 flex flex-col h-96 overflow-y-auto p-4 space-y-4">
                                {messages.length === 0 && (
                                    <div className="text-center text-gray-400 text-sm mt-10">
                                        <Sparkles className="inline-block mb-2 opacity-50" />
                                        <p>¿En qué te ayudo hoy?</p>
                                    </div>
                                )}
                                {messages.map((msg, i) => (
                                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[85%] ${msg.role === 'user' ? '' : 'w-full'}`}>
                                            <div className={`rounded-2xl px-4 py-2 text-sm shadow-sm ${msg.role === 'user' ? 'bg-pink-500 text-white rounded-br-none' : msg.isError ? 'bg-red-50 text-red-700 border border-red-200 rounded-bl-none' : 'bg-white text-gray-700 border border-gray-100 rounded-bl-none'}`}>
                                                {msg.text}
                                            </div>
                                            {renderMessageExtras(msg)}
                                        </div>
                                    </div>
                                ))}
                                {isThinking && (
                                    <div className="flex justify-start">
                                        <div className="bg-white px-4 py-2 rounded-2xl rounded-bl-none border flex items-center gap-2"><Loader2 size={14} className="animate-spin text-pink-500" /><span className="text-xs text-gray-400">Pensando...</span></div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>
                        </div>

                        <div className="p-3 bg-white border-t border-gray-100">
                            <form onSubmit={handleSend} className="relative">
                                <input
                                    type="text" value={input} onChange={(e) => setInput(e.target.value)}
                                    placeholder={isListening ? "Escuchando..." : getPlaceholder()}
                                    className="w-full pl-4 pr-20 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-pink-100 text-sm"
                                    disabled={isThinking || isListening}
                                />
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                    <button type="button" onClick={isListening ? stopListening : startListening} className={`p-2 rounded-lg ${isListening ? 'bg-red-50 text-red-500' : 'text-gray-400'}`}>
                                        {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                                    </button>
                                    <button type="submit" disabled={!input.trim() || isThinking} className="p-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 disabled:opacity-50">
                                        <Send size={18} />
                                    </button>
                                </div>
                            </form>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {!isOpen && (
    <motion.button 
        onClick={() => window.dispatchEvent(new Event('open-ai-tray'))} 
        className="fixed bottom-4 right-4 p-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-full shadow-lg z-40 group"
    >
        <Bot size={24} className="group-hover:rotate-12 transition-transform" />
    </motion.button>
)}
        </>
    );
};

export default AiAssistantTray;