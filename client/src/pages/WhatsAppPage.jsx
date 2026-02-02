import React, { useState } from 'react';
import usePollingQR from '../hooks/usePollingQR';
import { Smartphone, RefreshCw, CheckCircle, AlertTriangle, Power } from 'lucide-react';
import client from '../config/axios';
import toast from 'react-hot-toast';

const WhatsAppPage = () => {
    const { qr, status } = usePollingQR();
    const [restarting, setRestarting] = useState(false);

    const handleRestart = async () => {
        if (!confirm("¿Reiniciar la sesión de WhatsApp? Esto desconectará al bot momentáneamente.")) return;
        setRestarting(true);
        try {
            await client.post('/webhooks/refresh');
            toast.success("Reiniciando servicio... Espera un momento.");
            setTimeout(() => window.location.reload(), 3000); // Reload to force polling reset
        } catch (error) {
            console.error(error);
            toast.error("Error al reiniciar sesión");
            setRestarting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center border border-pink-100">
                <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 
                    ${status === 'ready' ? 'bg-green-100 text-green-600' : 'bg-pink-100 text-pink-600'}`}>
                    <Smartphone size={32} />
                </div>

                <h1 className="text-2xl font-bold text-gray-800 mb-2">Vincular WhatsApp</h1>
                <p className="text-gray-500 mb-8">Escanea el código para conectar el Bot.</p>

                <div className="bg-gray-100 p-4 rounded-2xl mb-6 flex items-center justify-center min-h-[280px]">
                    {status === 'ready' ? (
                        <div className="text-green-500 animate-bounce flex flex-col items-center">
                            <CheckCircle size={64} />
                            <span className="font-bold mt-4 text-lg">¡Conectado!</span>
                        </div>
                    ) : status === 'error' ? (
                        <div className="text-red-400 flex flex-col items-center gap-2">
                            <AlertTriangle size={48} />
                            <span>Error de conexión backend</span>
                            <button onClick={() => window.location.reload()} className="text-blue-500 underline text-sm">Reintentar</button>
                        </div>
                    ) : qr ? (
                        <div className="bg-white p-2 rounded-xl shadow-sm">
                            <img src={qr} alt="Código QR WhatsApp" className="w-[240px] h-[240px]" />
                        </div>
                    ) : (
                        <div className="text-gray-400 flex flex-col items-center gap-3">
                            <RefreshCw className="animate-spin" size={32} />
                            <span>Generando código...</span>
                        </div>
                    )}
                </div>

                <div className="flex justify-between items-center text-xs font-mono uppercase mb-4 px-4">
                    <span className="text-gray-400">Estado:</span>
                    <span className={`font-bold ${status === 'ready' ? 'text-green-600' : 'text-orange-500'}`}>
                        {status || 'Iniciando...'}
                    </span>
                </div>

                <button
                    onClick={handleRestart}
                    disabled={restarting}
                    className="w-full py-3 rounded-xl bg-gray-900 text-white font-bold hover:bg-black transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                    <Power size={18} />
                    {restarting ? 'Reiniciando...' : 'Reiniciar Sesión'}
                </button>
            </div>
        </div>
    );
};

export default WhatsAppPage;
