import React from 'react';
import { ResponsiveContainer } from 'recharts';

/**
 * ChartCard - A stable container for Recharts.
 */
const ChartCard = ({ title, children, height = "h-[300px]", className = "" }) => {
    return (
        <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6 ${className}`}>
            {title && (
                <h3 className="text-lg font-bold mb-4 text-gray-700 dark:text-gray-200">
                    {title}
                </h3>
            )}
            {/* Patrón Seguro: Contenedor con min-height explícito */}
            <div className={`w-full ${height} min-h-[260px]`}>
                <ResponsiveContainer width="100%" height="100%">
                    {children}
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default ChartCard;
