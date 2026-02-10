import { useState, useEffect, useRef } from "react";
import { Bot, X, Send, Sparkles, Loader2, AlertCircle, Mic, MicOff, History, Trash2 } from 'lucide-react';
// eslint-disable-next-line
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import aiService from '../services/aiService';
import toast from 'react-hot-toast';
import useDictation from '../hooks/useDictation';

import { useOrder } from '../context/OrderContext';

const AiAssistantTray = ({ isOpen, onClose }) => {
    const location = useLocation();
    const messagesEndRef = useRef(null);

    // Conditional hook usage - only use if context is available
    let updateOrder = null;
    try {
        const orderContext = useOrder();
        updateOrder = orderContext?.updateOrder;
    } catch (e) {
        // Context not available (component used outside OrderProvider)
        // This is fine - persistence will be skipped
    }

    const [messages, setMessages] = useState([
        { role: 'ai', text: '¡Hola! Soy tu asistente de pastelería. ¿En qué te ayudo hoy?' }
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
        // Hydrate order context from session
        if (session.extractedData && updateOrder) {
            const cleanDraft = Object.fromEntries(
                Object.entries(session.extractedData).filter(([_, v]) => v != null)
            );
            updateOrder(cleanDraft);
            toast.success("Sesión recuperada");

            // Restore chat processing mockup
            const aiText = `He recuperado el pedido para ${session.extractedData.cliente_nombre || 'el cliente'}.`;
            setMessages(prev => [...prev, { role: 'ai', text: aiText }]);
        }
        setShowHistory(false);
    };

    const { isListening, transcript, startListening, stopListening, resetTranscript, supported, elapsedMs, error: dictationError } = useDictation();

    // Sync dictation error
    useEffect(() => {
        if (dictationError) {
            setError(dictationError);
            // Clear error after 5s
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

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim() || isThinking) return;

        const userMessage = input;

        // PERSISTENCE: Save dictation to Order Context if available
        if (updateOrder) {
            updateOrder(prev => ({
                draftTranscriptRaw: (prev.draftTranscriptRaw || '') + '\n- ' + userMessage
            }));
        }

        setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
        setInput('');
        resetTranscript();
        setIsThinking(true);
        setError(null);

        try {
            // Use the new Parsing Endpoint for orders
            const response = await aiService.parseOrderIntent(userMessage);

            // NEW LOGIC: Always show assistant response if present
            if (response.assistant_response) {
                setMessages(prev => [...prev, { role: 'ai', text: response.assistant_response }]);
            }

            // AUTO-FILL: If draft data is returned (even partial), hydrate form
            if (response.draft && updateOrder) {
                // Determine if we should notify user of update
                // If it's a new draft or significant update
                updateOrder(response.draft);

                if (response.missing && response.missing.length > 0) {
                    //toast('Datos parciales actualizados', { icon: '️' });
                } else {
                    toast.success("Borrador actualizado");
                }
            }

            // Refresh sessions list
            loadSessions();

        } catch (err) {
            console.error(err);
            // Fallback
            try {
                const contextData = { currentPath: location.pathname };
                const legacyResponse = await aiService.sendMessageToAi(userMessage, contextData);
                setMessages(prev => [...prev, { role: 'ai', text: legacyResponse.text || legacyResponse.response || "Entendido." }]);
            } catch (legacyErr) {
                setError("No pude conectar con el cerebro. Intenta de nuevo.");
            }
        } finally {
            setIsThinking(false);
        }
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
                                        <p className="text-xs mt-2">Prueba: "Quiero un pastel de chocolate para 20 personas"</p>
                                    </div>
                                )}

                                {messages.map((msg, i) => (
                                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm shadow-sm ${msg.role === 'user'
                                            ? 'bg-pink-500 text-white rounded-br-none'
                                            : 'bg-white text-gray-700 border border-gray-100 rounded-bl-none'
                                            }`}>
                                            {msg.text}
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
                                    placeholder={isListening ? "Escuchando..." : "Escribe o usa el micrófono..."}
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
                                Potenciado por Gemini 2.0 Flash
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
                    onClick={onClose} // Changed to onClose to open the tray
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
