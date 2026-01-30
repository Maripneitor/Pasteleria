import React from 'react';
import { cn } from './Card'; // Reusing cn or moving it to utils

export default function PageHeader({ title, subtitle, actions }) {
    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{title}</h1>
                {subtitle && <p className="text-gray-500 mt-1 text-sm">{subtitle}</p>}
            </div>
            {actions && (
                <div className="flex items-center gap-3">
                    {actions}
                </div>
            )}
        </div>
    );
}
