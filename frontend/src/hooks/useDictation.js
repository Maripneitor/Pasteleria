import { useState, useEffect, useRef } from 'react';

export default function useDictation() {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [error, setError] = useState(null);
    const [elapsedMs, setElapsedMs] = useState(0);

    const recognitionRef = useRef(null);
    const timerRef = useRef(null);

    useEffect(() => {
        // Init Speech Recognition
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false; // Stop after sentence for better UX in chat
            recognitionRef.current.interimResults = true; // Changed to true for live feedback
            recognitionRef.current.lang = 'es-MX';

            recognitionRef.current.onstart = () => {
                setIsListening(true);
                setError(null);
                setElapsedMs(0);

                // Start Timer
                if (timerRef.current) clearInterval(timerRef.current);
                const startTime = Date.now();
                timerRef.current = setInterval(() => {
                    setElapsedMs(Date.now() - startTime);
                }, 100);
            };

            recognitionRef.current.onresult = (event) => {
                let finalTranscript = '';
                let interimTranscript = '';

                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        finalTranscript += event.results[i][0].transcript;
                    } else {
                        interimTranscript += event.results[i][0].transcript;
                    }
                }

                // For chat inputs, we usually want the accumulated value. 
                // To keep it simple for this hook's API: return the latest coherent string.
                // We'll trust the consumer to append or replace.
                // Actually, let's keep the previous behavior: simply expose the LATEST result.
                // Or better: accumulate if continuous=true vs single shot.
                // Given `continuous=false`, we get one result.

                const text = finalTranscript || interimTranscript;
                setTranscript(text);
            };

            recognitionRef.current.onerror = (event) => {
                console.error("Dictation error:", event.error);
                if (event.error === 'no-speech') {
                    // Ignore no-speech, just stop?
                    setError(null);
                } else if (event.error === 'audio-capture') {
                    setError("No se detectó micrófono. Verifica permisos.");
                } else if (event.error === 'not-allowed') {
                    setError("Permiso de micrófono denegado.");
                } else {
                    setError(event.error);
                }
                setIsListening(false);
                clearInterval(timerRef.current);
            };

            recognitionRef.current.onend = () => {
                setIsListening(false);
                clearInterval(timerRef.current);
            };
        } else {
            // eslint-disable-next-line
            console.warn("SpeechRecognition not supported");
        }
    }, []);

    const startListening = () => {
        if (recognitionRef.current && !isListening) {
            try {
                setTranscript(''); // Clear on new start
                recognitionRef.current.start();
            } catch (e) {
                console.error(e);
            }
        }
    };

    const stopListening = () => {
        if (recognitionRef.current && isListening) {
            recognitionRef.current.stop();
        }
        clearInterval(timerRef.current);
    };

    const resetTranscript = () => setTranscript('');

    return {
        isListening,
        transcript,
        startListening,
        stopListening,
        resetTranscript,
        error,
        elapsedMs,
        supported: !!(window.SpeechRecognition || window.webkitSpeechRecognition)
    };
}
