import React, { useRef, useState, useEffect } from 'react';
import { ResponsiveContainer } from 'recharts';

/**
 * ChartCard - A stable container for Recharts to prevent resizing warnings.
 * 
 * @param {string} title - Optional title for the card
 * @param {string} height - Height class or style (default: h-[300px])
 * @param {React.ReactNode} children - The Recharts component (PieChart, BarChart, etc.)
 * @param {string} className - Additional classes
 */
const ChartCard = ({ title, children, height = "h-[300px]", className = "" }) => {
    const containerRef = useRef(null);
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        if (!containerRef.current) return;

        const observer = new ResizeObserver((entries) => {
            for (let entry of entries) {
                const { width, height } = entry.contentRect;
                // Only render chart if we have valid dimensions
                if (width > 0 && height > 0) {
                    setIsReady(true);
                } else {
                    setIsReady(false);
                }
            }
        });

        observer.observe(containerRef.current);

        return () => {
            observer.disconnect();
        };
    }, []);

    return (
        <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6 ${className}`}>
            {title && (
                <h3 className="text-lg font-bold mb-4 text-gray-700 dark:text-gray-200">
                    {title}
                </h3>
            )}

            {/* 
              Recharts requirement:
              Parent of ResponsiveContainer must have a defined height.
              We use min-h-[... ] to ensure it never collapses to 0.
            */}
            <div
                ref={containerRef}
                className={`w-full ${height} min-h-[260px] transition-opacity duration-300 ${isReady ? 'opacity-100' : 'opacity-0'}`}
            >
                {isReady && (
                    <ResponsiveContainer width="100%" height="100%">
                        {children}
                    </ResponsiveContainer>
                )}
            </div>
        </div>
    );
};

export default ChartCard;
