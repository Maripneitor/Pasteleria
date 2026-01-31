import React from 'react';
import { cn } from '../../utils/cn';

const VARIANTS = {
    default: "bg-gray-100 text-gray-700",
    success: "bg-green-100 text-green-700",
    warning: "bg-yellow-100 text-yellow-700",
    danger: "bg-red-100 text-red-700",
    info: "bg-blue-100 text-blue-700",
    purple: "bg-purple-100 text-purple-700",
    pink: "bg-pink-100 text-pink-700"
};

export default function Badge({ children, variant = 'default', className }) {
    const v = VARIANTS[variant] || VARIANTS.default;
    return (
        <span className={cn("px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wide inline-flex items-center", v, className)}>
            {children}
        </span>
    );
}
