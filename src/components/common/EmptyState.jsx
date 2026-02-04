import React from 'react';
import { Ghost } from 'lucide-react';

export default function EmptyState({ title, description, icon: Icon = Ghost, action }) { // eslint-disable-line
    return (
        <div className="flex flex-col items-center justify-center py-16 text-center animate-in fade-in zoom-in-95 duration-300">
            <div className="bg-gray-50 p-4 rounded-full mb-4">
                <Icon size={32} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-1">{title}</h3>
            <p className="text-gray-500 max-w-sm mb-6">{description}</p>
            {action && <div>{action}</div>}
        </div>
    );
}
