import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react'; // 📦 Necesitas instalar esto: npm install qrcode.react
import client from '../config/axios';
import { Smartphone, RefreshCw, CheckCircle } from 'lucide-react';

const ConnectPage = () => {
    const [qrData, setQrData] = useState(null);
    const [status, setStatus] = useState('loading');

    const fetchQR = async () => {
        try {
            const res = await client.get('/webhooks/qr'); // Note: I'm keeping the path that works currently
            setStatus(res.data.status);
            setQrData(res.data.qr);
        } catch (error) {
            console.error("Error buscando QR", error);
        }
    };

    // Polling: Actualizar cada 3 segs
    useEffect(() => {
        fetchQR();
        const interval = setInterval(fetchQR, 3000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center border border-pink-100">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4 text-green-600">
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
                    ) : qrData ? (
                        <div className="bg-white p-2 rounded-xl shadow-sm">
                            <QRCodeSVG value={qrData} size={240} />
                        </div>
                    ) : (
                        <div className="text-gray-400 flex flex-col items-center gap-3">
                            <RefreshCw className="animate-spin" size={32} />
                            <span>Generando código...</span>
                        </div>
                    )}
                </div>

                <p className="text-xs text-gray-400 font-mono">Estado: {status?.toUpperCase()}</p>
            </div>
        </div>
    );
};

export default ConnectPage;
