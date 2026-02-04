import React from 'react';
// eslint-disable-next-line
import { motion, AnimatePresence } from 'framer-motion';

const VoiceModal = ({ isOpen, onClose, isListening }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400">✕</button>

                <h3 className="text-xl font-bold mb-2">Dictando Pedido...</h3>
                <p className="text-sm text-gray-500 mb-8">Habla claro, escucha tu pastel crearse.</p>

                {/* Visualizador de Ondas */}
                <div className="h-32 flex items-center justify-center gap-1 mb-8">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <motion.div
                            key={i}
                            className="w-2 bg-gradient-to-t from-pink-500 to-violet-500 rounded-full"
                            animate={{
                                height: isListening ? [20, 60, 20] : 20,
                                opacity: isListening ? 1 : 0.5
                            }}
                            transition={{
                                repeat: Infinity,
                                duration: 1,
                                delay: i * 0.1,
                                ease: "easeInOut"
                            }}
                        />
                    ))}
                </div>

                <div className="bg-gray-100 p-4 rounded-lg text-left text-sm text-gray-600 mb-4 h-24 overflow-y-auto">
                    "Quiero un pastel para 20 personas de chocolate con relleno de fresa para el próximo viernes..."
                </div>

                <button className="w-full bg-red-500 text-white py-3 rounded-xl font-bold shadow-lg hover:bg-red-600" onClick={onClose}>
                    Detener Grabación
                </button>
            </div>
        </div>
    );
};

export default VoiceModal;
