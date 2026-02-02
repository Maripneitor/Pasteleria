import { useState, useEffect } from "react";
import { Bot, X, Send, Sparkles, Loader2, AlertCircle, Mic, MicOff } from 'lucide-react';
// eslint-disable-next-line
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import aiService from '../services/aiService';
import toast from 'react-hot-toast';
import useDictation from '../hooks/useDictation';

const AiAssistantTray = ({ isOpen, onClose }) => {
    const location = useLocation();
    const [messages, setMessages] = useState([
        { role: 'ai', text: '¡Hola! Soy tu asistente de pastelería. ¿En qué te ayudo hoy?' }
    ]);
    const [input, setInput] = useState('');
    const [isThinking, setIsThinking] = useState(false);
    const [error, setError] = useState(null);

    const { isListening, transcript, startListening, stopListening, resetTranscript, supported } = useDictation();

    // Sync dictation to input
    useEffect(() => {
        if (transcript) {
            setInput(() => {
                // Si el transcript es nuevo, lo agregamos. 
                // Pero como transcript se acumula, mejor reemplazamos o concatenamos inteligentemente.
                // ResetTranscript se maneja manualmente tras envío.
                return transcript; // Simple replace for now, or ensure user edits.
            });
        }
    }, [transcript]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim() || isThinking) return;

        const userMessage = input;
        setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
        setInput('');
        resetTranscript(); // Clear dictation buffer
        setIsThinking(true);
        setError(null);

        try {
            const contextData = { currentPath: location.pathname };
            const response = await aiService.sendMessageToAi(userMessage, contextData);
            const aiText = response.response || "Entendido.";
            setMessages(prev => [...prev, { role: 'ai', text: aiText }]);
        } catch (err) {
            console.error(err);
            setError("No pude conectar con el cerebro. Intenta de nuevo.");
            toast.error("Error de conexión con la IA");
        } finally {
            setIsThinking(false);
        }
    };

    const toggleDictation = () => {
        if (isListening) stopListening();
        else startListening();
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.3 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black z-40 md:hidden"
                        onClick={onClose}
                    />

                    {/* Tray Container */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed inset-y-0 right-0 z-50 w-full md:w-96 bg-white shadow-2xl border-l border-gray-100 flex flex-col"
                    >
                        {/* Header */}
                        <div className="p-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white flex justify-between items-center shadow-md">
                            <div className="flex items-center gap-2">
                                <Sparkles size={20} className="animate-pulse" />
                                <h2 className="font-bold">Asistente IA</h2>
                            </div>
                            <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Chat Area */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
                            {messages.map((msg, idx) => (
                                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`
                                        max-w-[85%] p-3 rounded-2xl text-sm shadow-sm
                                        ${msg.role === 'user'
                                            ? 'bg-violet-600 text-white rounded-tr-none'
                                            : 'bg-white text-gray-700 border border-gray-100 rounded-tl-none'}
                                    `}>
                                        {msg.text}
                                    </div>
                                </div>
                            ))}

                            {/* Loading Indicator */}
                            {isThinking && (
                                <div className="flex justify-start">
                                    <div className="bg-white p-3 rounded-2xl rounded-tl-none border border-gray-100 shadow-sm flex items-center gap-2 text-gray-400 text-xs">
                                        <Loader2 size={14} className="animate-spin" /> Escribiendo...
                                    </div>
                                </div>
                            )}

                            {/* Error Indicator */}
                            {error && (
                                <div className="flex justify-center">
                                    <div className="bg-red-50 text-red-600 px-3 py-1 rounded-full text-xs flex items-center gap-1">
                                        <AlertCircle size={12} /> {error}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Input Area */}
                        <form onSubmit={handleSend} className="p-4 bg-white border-t border-gray-100">
                            <div className="relative flex items-center gap-2">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder={isListening ? "Escuchando..." : "Pregúntame algo..."}
                                    className={`w-full pl-4 pr-12 py-3 bg-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 transition text-sm ${isListening ? 'ring-2 ring-red-400 bg-red-50' : ''}`}
                                />

                                {supported && (
                                    <button
                                        type="button"
                                        onClick={toggleDictation}
                                        className={`absolute right-14 p-2 rounded-full transition ${isListening ? 'text-red-500 hover:bg-red-100' : 'text-gray-400 hover:bg-gray-200'}`}
                                        title="Dictar"
                                    >
                                        {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                                    </button>
                                )}

                                <button
                                    type="submit"
                                    className="p-3 bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition shadow-sm disabled:opacity-50"
                                    disabled={!input.trim() || isThinking}
                                >
                                    <Send size={18} />
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default AiAssistantTray;
