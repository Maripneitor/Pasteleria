import React, { useState, useEffect } from 'react';
import { X, Activity, CheckCircle, AlertCircle } from 'lucide-react';

const DebugPanel = () => {
    const [visible, setVisible] = useState(false);
    const [requests, setRequests] = useState([]);
    const [isEnabled, setIsEnabled] = useState(import.meta.env.VITE_DEBUG_MODE === 'true');

    useEffect(() => {
        const handleDebugEvent = (e) => {
            if (!isEnabled) return;

            const detail = e.detail; // { type: 'req'|'res'|'err', id, method, url, status, duration }
            setRequests(prev => {
                const list = [...prev];
                const existingIdx = list.findIndex(r => r.id === detail.id);

                if (existingIdx >= 0) {
                    list[existingIdx] = { ...list[existingIdx], ...detail };
                } else {
                    list.unshift(detail);
                }
                return list.slice(0, 5); // Keep last 5
            });
            setVisible(true);
        };

        window.addEventListener('debug:request', handleDebugEvent);
        return () => window.removeEventListener('debug:request', handleDebugEvent);
    }, [isEnabled]);

    if (!isEnabled || !visible) return null;

    return (
        <div className="fixed bottom-4 right-4 bg-gray-900/90 text-white p-4 rounded-xl shadow-2xl z-50 w-80 text-xs backdrop-blur-md border border-gray-700 font-mono">
            <div className="flex justify-between items-center mb-2 border-b border-gray-700 pb-2">
                <span className="flex items-center gap-2 font-bold text-green-400">
                    <Activity size={14} /> DIAGNOSTIC MODE
                </span>
                <button onClick={() => setVisible(false)} className="hover:text-red-400">
                    <X size={14} />
                </button>
            </div>
            <div className="space-y-2">
                {requests.map(req => (
                    <div key={req.id || Math.random()} className="border-b border-gray-800 pb-1 last:border-0">
                        <div className="flex justify-between items-center">
                            <span className={`font-bold ${req.error ? 'text-red-400' : 'text-blue-300'}`}>
                                {req.method} {req.url?.split('?')[0]}
                            </span>
                            {req.status && (
                                <span className={req.status >= 400 ? 'text-red-500' : 'text-green-500'}>
                                    {req.status}
                                </span>
                            )}
                        </div>
                        <div className="text-gray-400 flex justify-between mt-1">
                            <span>ID: {req.requestId?.slice(0, 8) || '...'}</span>
                            {req.duration && <span>{req.duration}ms</span>}
                        </div>
                        {req.errorMessage && (
                            <div className="text-red-400 mt-1 truncate" title={req.errorMessage}>
                                {req.errorMessage}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default DebugPanel;
