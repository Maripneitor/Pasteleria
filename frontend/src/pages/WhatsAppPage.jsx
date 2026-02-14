import React from 'react';
import usePollingQR from '../hooks/usePollingQR';
import { Smartphone, RefreshCw, CheckCircle, Power, LogOut, WifiOff, QrCode } from 'lucide-react';
import { Loader } from 'lucide-react';
import { getToken } from '../utils/auth';


const WhatsAppPage = () => {
    // Determine which version of the hook is active. 
    // The previous edit to hook added 'reload' and 'restart'.
    const hookData = usePollingQR();
    const { qr, status, reload, restart } = hookData;

    // Fallback if hook update failed or old version loaded? 
    // We assume hook update succeeded. 
    // If not, reload/restart might be undefined.
    // We'll safeguard just in case.

    const safeReload = reload || (() => window.location.reload());
    const safeRestart = restart || (() => window.location.reload()); // Fallback to reload if not available

    return (
        <div className="p-8 max-w-4xl mx-auto flex flex-col items-center justify-center min-h-[80vh] fade-in">
            <h1 className="text-3xl font-bold mb-2 text-gray-800">Conectar WhatsApp</h1>
            <p className="text-gray-500 mb-8 text-center max-w-md">
                Escanea el código QR para vincular la IA con tu número de WhatsApp Business.
            </p>

            <div className="p-8 flex flex-col items-center w-full max-w-md shadow-2xl border-0 bg-white/80 backdrop-blur-xl rounded-2xl">
                <div className="w-64 h-64 bg-gray-100 rounded-2xl flex items-center justify-center mb-6 overflow-hidden border-2 border-dashed border-gray-300 relative group">
                    {status === 'loading' && (
                        <div className="animate-pulse flex flex-col items-center text-gray-400">
                            <Loader className="animate-spin mb-2" />
                            <span className="text-xs font-bold uppercase tracking-wider">Cargando QR...</span>
                        </div>
                    )}

                    {status === 'error' && (
                        <div className="text-red-500 flex flex-col items-center text-center p-4">
                            <WifiOff size={40} className="mb-2" />
                            <span className="font-bold">Error de Conexión</span>
                            <button onClick={safeReload} className="mt-4 text-xs bg-red-100 text-red-600 px-3 py-1 rounded-full font-bold hover:bg-red-200 transition">
                                Reintentar
                            </button>
                        </div>
                    )}

                    {status === 'ready' && (
                        <div className="absolute inset-0 bg-green-500/10 flex flex-col items-center justify-center text-green-600 font-bold fade-in backdrop-blur-sm z-10">
                            <CheckCircle size={64} className="mb-4 drop-shadow-md" />
                            <span className="text-xl">Conectado</span>
                        </div>
                    )}

                    {/* QR Display - Uses direct backend URL for robustness */}
                    {status !== 'ready' && (
                        <img
                            src={`/api/whatsapp/qr?format=image&t=${Date.now()}&token=${getToken()}`}
                            alt="WhatsApp QR"
                            className={`w-full h-full object-contain scale-95 group-hover:scale-100 transition duration-500 ${status === 'loading' ? 'opacity-0' : 'opacity-100'}`}
                            onError={(e) => { e.target.style.display = 'none'; }}
                            onLoad={(e) => { e.target.style.display = 'block'; }}
                        />
                    )}
                </div>

                <div className="flex gap-4 w-full">
                    <button
                        onClick={safeReload}
                        className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition flex items-center justify-center gap-2"
                    >
                        <RefreshCw size={18} /> Recargar QR
                    </button>

                    {status === 'ready' ? (
                        <button
                            onClick={() => {
                                if (window.confirm("¿Cerrar sesión y desconectar?")) safeRestart();
                            }}
                            className="flex-1 py-3 bg-red-50 text-red-600 font-bold rounded-xl hover:bg-red-100 transition flex items-center justify-center gap-2"
                        >
                            <LogOut size={18} /> Desconectar
                        </button>
                    ) : (
                        <button
                            onClick={() => {
                                if (window.confirm("¿Reiniciar servicio de WhatsApp?")) safeRestart();
                            }}
                            className="flex-1 py-3 bg-blue-50 text-blue-600 font-bold rounded-xl hover:bg-blue-100 transition flex items-center justify-center gap-2"
                        >
                            <Power size={18} /> Reiniciar
                        </button>
                    )}
                </div>

                <div className="mt-6 flex flex-col gap-2 w-full">
                    <div className="flex items-center gap-3 p-3 bg-blue-50 text-blue-700 rounded-xl text-sm font-medium">
                        <Smartphone size={18} />
                        <span>Abre WhatsApp en tu teléfono</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-pink-50 text-pink-700 rounded-xl text-sm font-medium">
                        <QrCode size={18} />
                        <span>Ve a Dispositivos Vinculados &gt; Vincular</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WhatsAppPage;
