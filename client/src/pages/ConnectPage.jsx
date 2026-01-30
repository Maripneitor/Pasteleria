import React from 'react';
import usePollingQR from '../hooks/usePollingQR';
import { Smartphone, RefreshCw, CheckCircle, AlertTriangle } from 'lucide-react';

const ConnectPage = () => {
    const { qr, status } = usePollingQR();

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

                <div className="flex justify-center gap-2 text-xs font-mono uppercase">
                    <span className="text-gray-400">Estado:</span>
                    <span className={`font-bold ${status === 'ready' ? 'text-green-600' : 'text-orange-500'}`}>
                        {status || 'Iniciando...'}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default ConnectPage;
