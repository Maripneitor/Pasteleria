import React from 'react';

export default function PageShell({ title, actions, children }) {
    return (
        <div className="p-6 space-y-5 fade-in">
            <div className="flex items-center justify-between gap-3 flex-wrap">
                <h1 className="text-2xl font-extrabold text-gray-900">{title}</h1>
                <div className="flex gap-2">{actions}</div>
            </div>
            <div className="grid gap-4">{children}</div>
        </div>
    );
}
