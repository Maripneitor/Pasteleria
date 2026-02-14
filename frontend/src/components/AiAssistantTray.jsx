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

    // Conditional hook usage - only use if context is available
    let updateOrder = null;
    try {
        const orderContext = useOrder();
        updateOrder = orderContext?.updateOrder;
    } catch (e) {
        // Context not available
    }

    // ===== NEW: Mode Selector State =====
    const [mode, setMode] = useState('CREATE'); // CREATE | EDIT | SEARCH | INSIGHTS

    const [messages, setMessages] = useState([
        { role: 'ai', text: '¡Hola! Soy tu asistente de pastelería. ¿En qué te ayudo hoy?', mode: 'CREATE' }
    ]);
    const [input, setInput] = useState('');
    const [isThinking, setIsThinking] = useState(false);
    const [error, setError] = useState(null);
    const [showHistory, setShowHistory] = useState(false);
    const [sessions, setSessions] = useState([]);

    // Load history on mount
    useEffect(() => {
        loadSessions();
    }, []);

    const loadSessions = async () => {
        const data = await aiService.getSessions();
        if (data) setSessions(data);
    };

    const handleDeleteSession = async (id, e) => {
        e.stopPropagation();
        if (confirm('¿Eliminar esta conversación?')) {
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

    // Sync dictation error
    useEffect(() => {
        if (dictationError) {
            setError(dictationError);
            setTimeout(() => setError(null), 5000);
        }
    }, [dictationError]);

    // Sync dictation to input
    useEffect(() => {
        if (transcript) {
            setInput(transcript);
        }
    }, [transcript]);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isThinking]);

    // ⭐ ENHANCED handleSend with MODE SWITCH
    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim() || isThinking) return;

        const userMessage = input;

        // Save to context
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

                    setMessages(prev => [...prev, {
                        role: 'ai',
                        text: response.aiConfirmation || 'Pedido creado exitosamente',
                        mode: 'CREATE',
                        orderData: response.folio,
                        folioNumber: response.folioNumber,
                        extractedData: response.extractedData
                    }]);

                    // Auto-fill form si existe
                    if (response.extractedData && updateOrder) {
                        updateOrder(response.extractedData);
                        toast.success("Borrador actualizado");
                    }

                    loadSessions();
                    break;

                case 'EDIT':
                    // Extract order ID from message (can be improved with UI order selector)
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

            // Fallback to legacy parser for CREATE mode
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

    // ⭐ DYNAMIC PLACEHOLDER based on mode
    const getPlaceholder = () => {
        switch (mode) {
            case 'CREATE':
                return 'Ej: Pastel de chocolate para María, tel 5551234567, entrega 15 de marzo...';
            case 'EDIT':
                return 'Ej: Pedido 123 cambiar fecha al martes';
            case 'SEARCH':
                return 'Ej: pedidos de esta semana mayores a 800 pesos';
            case 'INSIGHTS':
                return 'Ej: ¿Cuánto hemos vendido este mes?';
            default:
                return 'Escribe tu mensaje...';
        }
    };

    // ⭐ RENDER extras based on mode
    const renderMessageExtras = (msg) => {
        if (!msg.mode || msg.isError) return null;

        switch (msg.mode) {
            case 'CREATE':
                if (msg.orderData) {
                    return (
                        <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                            <h4 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
                                <PlusCircle size={16} />
                                Pedido Creado: {msg.folioNumber}
                            </h4>
                            <div className="text-sm space-y-1 text-gray-700">
                                <p><strong>Cliente:</strong> {msg.orderData.cliente_nombre}</p>
                                <p><strong>Teléfono:</strong> {msg.orderData.cliente_telefono}</p>
                                <p><strong>Entrega:</strong> {new Date(msg.orderData.fecha_entrega).toLocaleDateString('es-MX')}</p>
                                <p><strong>Total:</strong> ${msg.orderData.total}</p>
                            </div>
                            <button
                                onClick={() => {
                                    navigate(`/pedidos/${msg.orderData.id}`);
                                    onClose();
                                }}
                                className="mt-2 w-full py-1.5 bg-green-600 text-white rounded hover:bg-green-700 text-sm transition"
                            >
                                Ver Pedido Completo
                            </button>
                        </div>
                    );
                }
                break;

            case 'EDIT':
                if (msg.changedFields && msg.changedFields.length > 0) {
                    return (
                        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                                <Edit3 size={16} />
                                Cambios Aplicados
                            </h4>
                            <ul className="text-sm space-y-1 text-gray-700 list-disc list-inside">
                                {msg.changedFields.map((field, idx) => (
                                    <li key={idx}>{field}</li>
                                ))}
                            </ul>
                            {msg.order && (
                                <button
                                    onClick={() => {
                                        navigate(`/pedidos/${msg.order.id}`);
                                        onClose();
                                    }}
                                    className="mt-2 w-full py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm transition"
                                >
                                    Ver Pedido
                                </button>
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
                                <Search size={16} />
                                {msg.count} Resultado{msg.count !== 1 ? 's' : ''}
                            </h4>
                            <div className="space-y-2 max-h-60 overflow-y-auto">
                                {msg.results.slice(0, 10).map((order) => (
                                    <div
                                        key={order.id}
                                        onClick={() => {
                                            navigate(`/pedidos/${order.id}`);
                                            onClose();
                                        }}
                                        className="block p-2 bg-white rounded border hover:border-yellow-400 transition cursor-pointer"
                                    >
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-semibold text-sm">{order.folioNumber}</p>
                                                <p className="text-xs text-gray-600">{order.cliente}</p>
                                            </div>
                                            <span className="text-sm font-bold text-green-600">
                                                ${order.total}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">
                                            Entrega: {new Date(order.fecha_entrega).toLocaleDateString('es-MX')}
                                        </p>
                                    </div>
                                ))}
                            </div>
                            {msg.count > 10 && (
                                <p className="text-xs text-gray-500 mt-2 text-center">
                                    ... y {msg.count - 10} más
                                </p>
                            )}
                            {msg.totalValue !== undefined && (
                                <div className="mt-3 pt-3 border-t border-yellow-200 text-sm text-gray-700">
                                    <p><strong>Total:</strong> ${msg.totalValue.toFixed(2)}</p>
                                </div>
                            )}
                        </div>
                    );
                }
                break;

            case 'INSIGHTS':
                if (msg.dashboardData) {
                    return (
                        <div className="mt-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                            <h4 className="font-semibold text-purple-800 mb-2 flex items-center gap-2">
                                <BarChart3 size={16} />
                                Datos del Dashboard
                            </h4>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className="p-2 bg-white rounded">
                                    <p className="text-gray-500">Total Pedidos</p>
                                    <p className="font-bold text-lg">{msg.dashboardData.totalOrders}</p>
                                </div>
                                <div className="p-2 bg-white rounded">
                                    <p className="text-gray-500">Este Mes</p>
                                    <p className="font-bold text-lg">{msg.dashboardData.monthOrders}</p>
                                </div>
                                <div className="p-2 bg-white rounded">
                                    <p className="text-gray-500">Ingresos Mes</p>
                                    <p className="font-bold text-green-600">${msg.dashboardData.monthRevenue}</p>
                                </div>
                                <div className="p-2 bg-white rounded">
                                    <p className="text-gray-500">Pendientes</p>
                                    <p className="font-bold text-orange-600">{msg.dashboardData.pendingOrders}</p>
                                </div>
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
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 50 }}
                        className="fixed bottom-4 right-4 w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden flex flex-col"
                        style={{ maxHeight: '80vh' }}
                    >
                        {/* Header */}
                        <div className="bg-gradient-to-r from-pink-500 to-rose-500 p-4 flex justify-between items-center text-white">
                            <div className="flex items-center gap-2">
                                <Bot size={20} />
                                <span className="font-medium">Asistente IA</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setShowHistory(!showHistory)}
                                    className="p-1 hover:bg-white/20 rounded transition"
                                    title="Historial de Chats"
                                >
                                    <History size={18} />
                                </button>
                                <button onClick={onClose} className="p-1 hover:bg-white/20 rounded transition">
                                    <X size={18} />
                                </button>
                            </div>
                        </div>

                        {/* ⭐ MODE SELECTOR */}
                        <div className="flex gap-1 p-2 border-b bg-gray-50">
                            <button
                                onClick={() => setMode('CREATE')}
                                className={`flex-1 py-2 px-2 rounded text-xs font-medium transition-all flex items-center justify-center gap-1 ${mode === 'CREATE'
                                    ? 'bg-pink-500 text-white shadow'
                                    : 'bg-white text-gray-700 hover:bg-gray-100'
                                    }`}
                            >
                                <PlusCircle size={14} />
                                Crear
                            </button>
                            <button
                                onClick={() => setMode('EDIT')}
                                className={`flex-1 py-2 px-2 rounded text-xs font-medium transition-all flex items-center justify-center gap-1 ${mode === 'EDIT'
                                    ? 'bg-blue-500 text-white shadow'
                                    : 'bg-white text-gray-700 hover:bg-gray-100'
                                    }`}
                            >
                                <Edit3 size={14} />
                                Editar
                            </button>
                            <button
                                onClick={() => setMode('SEARCH')}
                                className={`flex-1 py-2 px-2 rounded text-xs font-medium transition-all flex items-center justify-center gap-1 ${mode === 'SEARCH'
                                    ? 'bg-green-500 text-white shadow'
                                    : 'bg-white text-gray-700 hover:bg-gray-100'
                                    }`}
                            >
                                <Search size={14} />
                                Buscar
                            </button>
                            <button
                                onClick={() => setMode('INSIGHTS')}
                                className={`flex-1 py-2 px-2 rounded text-xs font-medium transition-all flex items-center justify-center gap-1 ${mode === 'INSIGHTS'
                                    ? 'bg-purple-500 text-white shadow'
                                    : 'bg-white text-gray-700 hover:bg-gray-100'
                                    }`}
                            >
                                <BarChart3 size={14} />
                                Insights
                            </button>
                        </div>

                        {/* Body */}
                        <div className="flex-1 bg-gray-50 overflow-hidden relative flex">
                            {/* History Sidebar */}
                            <AnimatePresence>
                                {showHistory && (
                                    <motion.div
                                        initial={{ x: -200, opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        exit={{ x: -200, opacity: 0 }}
                                        className="absolute inset-y-0 left-0 w-64 bg-white shadow-lg z-10 border-r border-gray-200 overflow-y-auto"
                                    >
                                        <div className="p-3 border-b text-xs font-semibold text-gray-500 uppercase">
                                            Recientes
                                        </div>
                                        {sessions.length === 0 ? (
                                            <div className="p-4 text-sm text-gray-400 text-center">Sin historial</div>
                                        ) : (
                                            sessions.map(s => (
                                                <div
                                                    key={s.id}
                                                    onClick={() => handleLoadSession(s)}
                                                    className="p-3 border-b hover:bg-pink-50 cursor-pointer group relative"
                                                >
                                                    <div className="text-sm font-medium text-gray-800 truncate">
                                                        {s.summary || `Sesión #${s.id}`}
                                                    </div>
                                                    <div className="text-xs text-gray-400">
                                                        {new Date(s.updatedAt).toLocaleDateString()}
                                                    </div>
                                                    <button
                                                        onClick={(e) => handleDeleteSession(s.id, e)}
                                                        className="absolute right-2 top-3 p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            ))
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>

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
                                            <div className={`rounded-2xl px-4 py-2 text-sm shadow-sm ${msg.role === 'user'
                                                ? 'bg-pink-500 text-white rounded-br-none'
                                                : msg.isError
                                                    ? 'bg-red-50 text-red-700 border border-red-200 rounded-bl-none'
                                                    : 'bg-white text-gray-700 border border-gray-100 rounded-bl-none'
                                                }`}>
                                                {msg.text}
                                            </div>
                                            {renderMessageExtras(msg)}
                                        </div>
                                    </div>
                                ))}

                                {isThinking && (
                                    <div className="flex justify-start">
                                        <div className="bg-white px-4 py-2 rounded-2xl rounded-bl-none border border-gray-100 shadow-sm flex items-center gap-2">
                                            <Loader2 size={14} className="animate-spin text-pink-500" />
                                            <span className="text-xs text-gray-400">Pensando...</span>
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>
                        </div>

                        {/* Input Area */}
                        <div className="p-3 bg-white border-t border-gray-100">
                            {error && (
                                <div className="text-xs text-red-500 mb-2 px-2 flex items-center justify-between">
                                    <span>{error}</span>
                                    <button onClick={() => setError(null)}><X size={12} /></button>
                                </div>
                            )}

                            {/* Dictation Feedback */}
                            {isListening ? (
                                <div className="mb-2 p-2 bg-pink-50 rounded-lg border border-pink-100 animate-pulse">
                                    <div className="flex items-center gap-2 text-pink-600 text-xs font-medium mb-1">
                                        <Mic size={12} className="animate-ping" />
                                        Escuchando...
                                    </div>
                                    <p className="text-sm text-gray-700 italic">
                                        {transcript || "Habla ahora..."}
                                    </p>
                                </div>
                            ) : transcript && (
                                <div className="mb-2 p-2 bg-gray-50 rounded-lg border border-gray-100 relative group">
                                    <p className="text-sm text-gray-700">{transcript}</p>
                                    <button
                                        onClick={resetTranscript}
                                        className="absolute top-1 right-1 p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100"
                                    >
                                        <X size={12} />
                                    </button>
                                </div>
                            )}

                            <form onSubmit={handleSend} className="relative">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder={isListening ? "Escuchando..." : getPlaceholder()}
                                    className="w-full pl-4 pr-20 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-pink-100 transition-all text-sm"
                                    disabled={isThinking || isListening}
                                />
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                    <button
                                        type="button"
                                        onClick={isListening ? stopListening : startListening}
                                        className={`p-2 rounded-lg transition-all ${isListening
                                            ? 'bg-red-50 text-red-500 hover:bg-red-100'
                                            : 'hover:bg-gray-200 text-gray-400 hover:text-gray-600'
                                            }`}
                                        title={isListening ? "Detener dictado" : "Iniciar dictado"}
                                    >
                                        {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                                    </button>

                                    <button
                                        type="submit"
                                        disabled={!input.trim() || isThinking}
                                        className="p-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                                    >
                                        <Send size={18} />
                                    </button>
                                </div>
                            </form>
                            <div className="text-[10px] text-center text-gray-300 mt-2">
                                Potenciado por OpenAI GPT-4o-mini
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Toggle Button */}
            {!isOpen && (
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onClose}
                    className="fixed bottom-4 right-4 p-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-full shadow-lg hover:shadow-pink-500/30 transition-all z-40 group"
                >
                    <Bot size={24} className="group-hover:rotate-12 transition-transform" />
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-pink-500"></span>
                    </span>
                </motion.button>
            )}
        </>
    );
};

export default AiAssistantTray;
