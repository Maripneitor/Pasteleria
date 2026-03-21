import React, { useState } from 'react';
import usePollingQR from '@/hooks/usePollingQR';
import { Smartphone, RefreshCw, CheckCircle, Power, LogOut, WifiOff, QrCode, Loader } from 'lucide-react';

const WhatsAppPage = () => {
    const { qr, status, reload, restart } = usePollingQR();
    const [imgLoading, setImgLoading] = useState(true);

    const safeReload = reload || (() => window.location.reload());
    const safeRestart = restart || (() => window.location.reload());

    const isInitialLoading = status === 'loading' || status === 'initializing';
    const shouldShowQR = status === 'qr' || (qr && status !== 'ready' && status !== 'error');

    return (
        <div className="p-8 max-w-4xl mx-auto flex flex-col items-center justify-center min-h-[80vh] fade-in">
            <h1 className="text-3xl font-bold mb-2 text-gray-800">Conectar WhatsApp</h1>
            <p className="text-gray-500 mb-8 text-center max-w-md">
                Escanea el código QR para vincular la IA con tu número de WhatsApp Business.
            </p>

            <div className="p-8 flex flex-col items-center w-full max-w-md shadow-2xl border-0 bg-white/80 backdrop-blur-xl rounded-2xl">
                
                {/* CONTENEDOR DEL QR */}
                <div className="w-64 h-64 bg-gray-100 rounded-2xl flex items-center justify-center mb-6 overflow-hidden border-2 border-dashed border-gray-300 relative bg-white">
                    
                    {/* 1. Loader Principal */}
                    {(isInitialLoading || (shouldShowQR && imgLoading)) && (
                        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-gray-50 text-gray-400 transition-opacity duration-300">
                            <Loader className="animate-spin mb-2" />
                            <span className="text-[10px] font-bold uppercase tracking-wider">
                                {status === 'initializing' ? 'Inicializando servicio...' : 'Obteniendo QR...'}
                            </span>
                        </div>
                    )}

                    {/* 2. Pantalla de Error */}
                    {status === 'error' && (
                        <div className="absolute inset-0 z-40 bg-white flex flex-col items-center justify-center text-center p-4 text-red-500">
                            <WifiOff size={40} className="mb-2" />
                            <span className="font-bold text-sm">Error de Conexión</span>
                            <button onClick={safeReload} className="mt-4 text-xs bg-red-50 text-red-600 px-3 py-1 rounded-full font-bold hover:bg-red-200 transition">
                                Reintentar
                            </button>
                        </div>
                    )}

                    {/* 3. Pantalla de Éxito (Conectado) */}
                    {status === 'ready' && (
                        <div className="absolute inset-0 z-40 bg-green-500/10 flex flex-col items-center justify-center text-green-600 font-bold fade-in backdrop-blur-sm">
                            <CheckCircle size={64} className="mb-4 drop-shadow-md" />
                            <span className="text-xl">Conectado</span>
                        </div>
                    )}

                    {/* 4. EL QR - LIMPIO Y ELEGANTE */}
                    {shouldShowQR && (
                        <div className="absolute inset-0 z-20 bg-white flex items-center justify-center rounded-2xl overflow-hidden">
                            <img
                                src={`/api/v1/whatsapp/qr?format=image&t=${Date.now()}`}
                                alt="WhatsApp QR"
                                className="w-full h-full object-contain p-4 transition-opacity duration-500"
                                style={{ opacity: imgLoading ? 0 : 1 }}
                                onLoad={() => setImgLoading(false)}
                                onError={(e) => {
                                    if (qr && !qr.startsWith('http')) {
                                        e.target.src = qr;
                                    }
                                    setImgLoading(false);
                                }}
                            />
                        </div>
                    )}
                </div>

                {/* BOTONES */}
                <div className="flex gap-4 w-full">
                    <button
                        onClick={safeReload}
                        className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition flex items-center justify-center gap-2"
                    >
                        <RefreshCw size={18} /> Recargar QR
                    </button>

                    <button
                        onClick={() => {
                            const msg = status === 'ready' ? "¿Cerrar sesión y desconectar WhatsApp?" : "¿Reiniciar el servicio de WhatsApp?";
                            if (window.confirm(msg)) safeRestart();
                        }}
                        className={`flex-1 py-3 font-bold rounded-xl transition flex items-center justify-center gap-2 ${
                            status === 'ready' ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                        }`}
                    >
                        {status === 'ready' ? <LogOut size={18} /> : <Power size={18} />}
                        {status === 'ready' ? 'Desconectar' : 'Reiniciar'}
                    </button>
                </div>

                <div className="mt-6 flex flex-col gap-2 w-full">
                    <div className="flex items-center gap-3 p-3 bg-blue-50 text-blue-700 rounded-xl text-sm font-medium">
                        <Smartphone size={18} />
                        <span>Abre WhatsApp en tu teléfono</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-pink-50 text-pink-700 rounded-xl text-sm font-medium">
                        <QrCode size={18} />
                        <span>Dispositivos Vinculados &gt; Vincular</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WhatsAppPage;