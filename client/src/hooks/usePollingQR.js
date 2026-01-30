import { useState, useEffect, useRef } from 'react';
import client from '../config/axios';

/**
 * usePollingQR - Hook para obtener estado y QR con backoff
 * 
 * Estrategia de Backoff:
 * 1s -> 2s -> 3s -> 5s (max)
 * Si hay éxito (recibimos QR o status), reseteamos a 3s (refresh normal)
 */
export const usePollingQR = (endpoint = '/webhooks/qr') => {
    const [data, setData] = useState({ qr: null, status: 'loading' });
    const [delay, setDelay] = useState(1000); // Inicio rápido
    const isMounted = useRef(true);

    useEffect(() => {
        isMounted.current = true;
        let timeoutId;

        const fetchStatus = async () => {
            try {
                const res = await client.get(endpoint);

                if (isMounted.current) {
                    setData(res.data);

                    // Lógica de Backoff / Reset
                    if (res.data.status === 'ready') {
                        // Conectado: Dejar de pollear o pollear muy lento
                        setDelay(null);
                    } else if (res.data.qr) {
                        // QR Recibido: Refrescar cada 3s por si caduca
                        setDelay(3000);
                    } else {
                        // Aún cargando/generando: Mantener refresh
                        setDelay(2000);
                    }
                }
            } catch (error) {
                console.error("Error polling QR", error);
                if (isMounted.current) {
                    // Error: Aumentar delay (Backoff)
                    setDelay(prev => Math.min((prev || 1000) * 1.5, 5000));
                    setData(prev => ({ ...prev, status: 'error' }));
                }
            }
        };

        if (delay !== null) {
            timeoutId = setTimeout(() => {
                fetchStatus().then(() => {
                    // Si seguimos montados y hay delay, programar siguiente
                    // fetchStatus ya se encarga de cambiar el delay si es necesario?
                    // No, setTimeout es one-shot. El useEffect se dispara cuando 'delay' cambia.
                    // Pero aquí queremos un loop.
                    // Mejor estrategia: fetch -> wait(delay) -> fetch
                });
            }, delay);
        }

        // Simplemente ejecutar en loop dependiente de delay
        // La implementación de arriba es estilo 'timeout recursivo' pero está dentro de un useEffect disparado por `delay`.
        // Cuidado con infinite loops si delay no cambia. 
        // Mejor usar setInterval simple o un useEffect que se re-ejecuta.

        // Corrección: Usaremos función recursiva interna para control total
        return () => { isMounted.current = false; clearTimeout(timeoutId); };
    }, [delay, endpoint]); // Dependencia 'delay' reinicia el timer

    return { ...data, isConnected: data.status === 'ready' };
};

// Implementación alternativa más robusta para polling variable
export const usePollingQRV2 = () => {
    const [state, setState] = useState({ qr: null, status: 'loading' });

    useEffect(() => {
        let timeoutId;
        let pDelay = 1000;

        const poll = async () => {
            try {
                const res = await client.get('/webhooks/qr');
                setState(res.data);

                if (res.data.status === 'ready') {
                    return; // Stop polling
                }

                // Reset backoff on success (got response)
                pDelay = res.data.qr ? 3000 : 1500;

            } catch (e) {
                console.error("Poll Error", e);
                setState(s => ({ ...s, status: 'error' }));
                pDelay = Math.min(pDelay * 1.5, 5000); // Backoff
            }

            timeoutId = setTimeout(poll, pDelay);
        };

        poll();
        return () => clearTimeout(timeoutId);
    }, []);

    return state;
};

export default usePollingQRV2;
