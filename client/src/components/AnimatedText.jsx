import React from 'react';
// eslint-disable-next-line
import { motion } from 'framer-motion';

const AnimatedText = ({ text, className }) => {
    // Separa el texto en letras para animar una por una
    const letters = Array.from(text);

    const container = {
        hidden: { opacity: 0 },
        visible: (i = 1) => ({
            opacity: 1,
            transition: { staggerChildren: 0.05, delayChildren: 0.1 * i }, // Más suave
        }),
    };

    const child = {
        visible: {
            opacity: 1,
            y: 0,
            transition: { type: "spring", damping: 15, stiffness: 80 }, // Más relajado
        },
        hidden: { opacity: 0, y: 15, transition: { type: "spring", damping: 15, stiffness: 80 } },
    };

    return (
        <motion.div style={{ display: "flex", overflow: "hidden" }} variants={container} initial="hidden" animate="visible" className={className}>
            {letters.map((letter, index) => (
                <motion.span variants={child} key={index}>
                    {letter === " " ? "\u00A0" : letter}
                </motion.span>
            ))}
        </motion.div>
    );
};

export default AnimatedText;
