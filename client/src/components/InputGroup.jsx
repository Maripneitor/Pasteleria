import React, { useState } from 'react';
import { motion } from 'framer-motion';

const InputGroup = ({ icon: Icon, type, placeholder, register, name, error }) => {
    const [isFocused, setIsFocused] = useState(false);

    return (
        <div className="mb-4">
            <motion.div
                className={`flex items-center bg-gray-50 border rounded-xl overflow-hidden transition-all duration-300 ${isFocused ? 'border-pink-500 shadow-lg shadow-pink-100 ring-2 ring-pink-100' : 'border-gray-200'
                    } ${error ? 'border-red-500 bg-red-50' : ''}`}
                animate={{ scale: isFocused ? 1.02 : 1 }}
            >
                <div className={`p-3 ${isFocused ? 'text-pink-500' : 'text-gray-400'}`}>
                    <Icon size={20} />
                </div>
                <input
                    type={type}
                    placeholder={placeholder}
                    {...register(name, { required: true })}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    className="w-full py-3 pr-4 bg-transparent outline-none text-gray-700 placeholder-gray-400 font-medium"
                />
            </motion.div>
            {error && (
                <motion.span
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xs text-red-500 font-bold ml-1 mt-1 block"
                >
                    ⚠ {placeholder} es requerido
                </motion.span>
            )}
        </div>
    );
};

export default InputGroup;
