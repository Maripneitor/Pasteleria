import React from 'react';
import { cn } from './Card';

export function Table({ children, className }) {
    return (
        <div className={cn("overflow-x-auto w-full", className)}>
            <table className="w-full text-left text-sm whitespace-nowrap">
                {children}
            </table>
        </div>
    );
}

export function TableHeader({ children }) {
    return <thead className="bg-gray-50 text-gray-500 border-b border-gray-100 font-semibold uppercase text-xs">{children}</thead>;
}

export function TableBody({ children }) {
    return <tbody className="divide-y divide-gray-50">{children}</tbody>;
}

export function TableRow({ children, className, ...props }) {
    return <tr className={cn("hover:bg-gray-50/50 transition-colors", className)} {...props}>{children}</tr>;
}

export function TableHead({ children, className }) {
    return <th className={cn("px-4 py-3 font-medium", className)}>{children}</th>;
}

export function TableCell({ children, className }) {
    return <td className={cn("px-4 py-3 text-gray-700", className)}>{children}</td>;
}
