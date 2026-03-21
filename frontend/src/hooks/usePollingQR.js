import { useState, useEffect, useRef } from 'react';
import client from '@/config/axios';

/**
 * usePollingQRV2 - Hook para obtener estado y QR con backoff inteligente.
 * 
 * - Silencia errores de consola y toasts para no contaminar la UI.
 * - Implementa backoff exponencial con límite máximo de reintentos.
 * - Para el polling cuando se conecta o tras muchos errores consecutivos.
 */
const MAX_CONSECUTIVE_ERRORS = 5;

export const usePollingQRV2 = () => {
    const [state, setState] = useState({ qr: null, status: 'loading' });
    const mountedRef = useRef(true);
    const errorCountRef = useRef(0);

    const loadQR = async () => {
    try {
        const res = await client.get('/whatsapp/qr', { 
            skipToast: true,
            // 👇 Esto le dice a Axios: "Un 404 es una respuesta aceptable, no lances un error rojo"
            validateStatus: function (status) {
                return status >= 200 && status < 300 || status === 404; 
            }
        });

        // Si es 404, manejamos la espera sin lanzar excepción
        if (res.status === 404) {
            if (mountedRef.current) setState(s => ({ ...s, status: 'initializing' }));
            return null;
        }

        // Si es 200, ¡tenemos el QR!
        errorCountRef.current = 0;
        if (mountedRef.current) {
            setState(res.data);
        }
        return res.data;

    } catch (err) {
        // Aquí solo caerán errores reales (500, no hay internet, etc.)
        errorCountRef.current++;
        if (mountedRef.current) setState(s => ({ ...s, status: 'error' }));
        return null;
    }
};

    const restartSession = async () => {
    try {
        // ✅ Cambiamos null por {}
        await client.post('/whatsapp/refresh', {}, { skipToast: true }); 
        errorCountRef.current = 0;
        setState({ qr: null, status: 'loading' });
    } catch {
        // silently fail — user can retry manually
    }
};

    useEffect(() => {
        mountedRef.current = true;
        let timeoutId;

        const poll = async () => {
            if (!mountedRef.current) return;

            // Stop polling after too many consecutive errors
            if (errorCountRef.current >= MAX_CONSECUTIVE_ERRORS) {
                setState(s => ({ ...s, status: 'error' }));
                return;
            }

            const data = await loadQR();

            if (!mountedRef.current) return;

            // Connected — stop polling
            if (data?.status === 'ready') return;

            // Backoff: longer waits on errors, shorter on success
            const delay = errorCountRef.current > 0
                ? Math.min(2000 * Math.pow(1.5, errorCountRef.current), 15000)
                : data?.qr ? 3000 : 2000;

            timeoutId = setTimeout(poll, delay);
        };

        poll();

        return () => {
            mountedRef.current = false;
            clearTimeout(timeoutId);
        };
    }, []);

    return { ...state, reload: loadQR, restart: restartSession };
};

// Legacy export for compatibility
export const usePollingQR = usePollingQRV2;
export default usePollingQRV2;
