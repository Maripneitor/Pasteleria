import React from 'react';
import { cn } from './Card';
import { Loader2 } from 'lucide-react';

const VARIANTS = {
    primary: "bg-pink-600 hover:bg-pink-700 text-white shadow-sm shadow-pink-200",
    secondary: "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50",
    danger: "bg-red-50 text-red-600 hover:bg-red-100 border border-red-100",
    ghost: "bg-transparent hover:bg-gray-100 text-gray-600",
    dark: "bg-gray-900 text-white hover:bg-black"
};

const SIZES = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base"
};

export default function Button({
    children,
    variant = 'primary',
    size = 'md',
    className,
    loading,
    disabled,
    icon: Icon,
    ...props
}) {
    return (
        <button
            className={cn(
                "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95",
                VARIANTS[variant],
                SIZES[size],
                className
            )}
            disabled={loading || disabled}
            {...props}
        >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {!loading && Icon && <Icon size={18} />}
            {children}
        </button>
    );
}
