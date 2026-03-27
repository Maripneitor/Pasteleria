import React, { useState, useEffect } from 'react';
import { useOrder } from '@/context/OrderContext';
import { Calendar, Clock, Cake, Layers, Loader2, X, Mic } from 'lucide-react';
import catalogApi from '@/features/catalogs/api/catalogs.api';

const StepB_OrderDetails = ({ next, prev }) => {
    const { orderData, updateOrder } = useOrder();
    const [flavors, setFlavors] = useState([]);
    const [fillings, setFillings] = useState([]);
    const [shapes, setShapes] = useState([]); // 🔥 ESTADO PARA LAS FORMAS
    const [loading, setLoading] = useState(true);

    // 🔥 ESTADO LOCAL BLINDADO PARA LOS PISOS
    const [localPisos, setLocalPisos] = useState(() => {
        const ctxPisos = orderData.pisos || [];
        return Array.from({ length: 8 }, (_, i) => ({
            personas: '', panes: [], rellenos: [], notas: '',
            ...(ctxPisos[i] || {})
        }));
    });

    // Load Catalogs
    useEffect(() => {
        const load = async () => {
            try {
                // 🔥 AHORA TRAEMOS LAS FORMAS DESDE LA BD
                const [f, c, s] = await Promise.all([
                    catalogApi.getFlavors(false),
                    catalogApi.getFillings(false),
                    catalogApi.getShapes('MAIN', false) // Asumimos tipo 'Base', ajústalo si tu BD usa otro
                ]);
                setFlavors(f);
                setFillings(c);
                setShapes(s);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    // 🔄 SINCRONIZADOR SILENCIOSO: Empuja al Contexto sin perder datos
    useEffect(() => {
        updateOrder({ pisos: localPisos });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [localPisos]);

    // Helper for Time Picker (12h format as requested)
    const hours = Array.from({ length: 12 }, (_, i) => i + 1);
    const minutes = ['00', '15', '30', '45'];
    const periods = ['AM', 'PM'];

    // Calculamos la hora al vuelo para matar el "Efecto Ping-Pong"
    const getParsedTime = () => {
        if (!orderData.deliveryTime) return { hour: '12', minute: '00', period: 'PM' };
        
        const timeClean = orderData.deliveryTime.replace(/[^0-9:]/g, ''); 
        if (!timeClean.includes(':')) return { hour: '12', minute: '00', period: 'PM' };

        const [h24, m] = timeClean.split(':');
        let h = parseInt(h24, 10) || 12;
        let p = 'AM';

        if (h >= 12) {
            p = 'PM';
            if (h > 12) h -= 12;
        }
        if (h === 0) h = 12;

        return { hour: h.toString(), minute: m || '00', period: p };
    };

    const handleTimeChange = (field, value) => {
        const current = getParsedTime();
        const newTime = { ...current, [field]: value };
        
        let h = parseInt(newTime.hour, 10);
        if (newTime.period === 'PM' && h !== 12) h += 12;
        if (newTime.period === 'AM' && h === 12) h = 0;

        const hStr = h.toString().padStart(2, '0');
        updateOrder({ deliveryTime: `${hStr}:${newTime.minute}` }); 
    };

    const parsedTime = getParsedTime();

    // Soportamos "Base" o "Base/Especial" por si el backend lo transforma
    const isBase = orderData.tipo_folio === 'Base' || orderData.tipo_folio === 'Base/Especial';
    
    // 🛡️ MANEJADORES DE PISOS INMUTABLES
    const handleUpdatePiso = (idx, field, val) => {
        setLocalPisos(prev => {
            const newPisos = [...prev];
            newPisos[idx] = { ...newPisos[idx], [field]: val };
            return newPisos;
        });
    };

    const handleAddItem = (idx, field, value) => {
        if (!value) return;
        setLocalPisos(prev => {
            const newPisos = [...prev];
            const piso = newPisos[idx];
            const currentList = Array.isArray(piso[field]) ? piso[field] : (piso[field] ? [piso[field]] : []);
            const max = field === 'panes' ? 3 : 2;
            
            if (currentList.length >= max) {
                import('react-hot-toast').then(m => m.default.error(`Solo puedes agregar hasta ${max} ${field}`));
                return prev;
            }
            if (!currentList.includes(value)) {
                newPisos[idx] = { ...piso, [field]: [...currentList, value] };
            }
            return newPisos;
        });
    };

    const handleRemoveItem = (idx, field, tagIndex) => {
        setLocalPisos(prev => {
            const newPisos = [...prev];
            const piso = newPisos[idx];
            const currentList = Array.isArray(piso[field]) ? [...piso[field]] : [];
            currentList.splice(tagIndex, 1);
            newPisos[idx] = { ...piso, [field]: currentList };
            return newPisos;
        });
    };

    const startDictation = (idx) => {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            import('react-hot-toast').then(m => m.default.error('Dictado por voz no soportado en este navegador'));
            return;
        }
        
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.lang = 'es-MX';
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onstart = () => {
            import('react-hot-toast').then(m => m.default.success('Escuchando... dicta ahora 🎙️'));
        };

        recognition.onresult = (event) => {
            const text = event.results[0][0].transcript;
            setLocalPisos(prev => {
                const newPisos = [...prev];
                const currentNotas = newPisos[idx].notas || '';
                newPisos[idx] = { ...newPisos[idx], notas: currentNotas ? `${currentNotas} ${text}` : text };
                return newPisos;
            });
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error', event.error);
            import('react-hot-toast').then(m => m.default.error('No se pudo escuchar correctamente.'));
        };

        recognition.start();
    };

    // Validation usando localPisos para mayor precisión en tiempo real
    const hasPisos = isBase && localPisos.some(p => p.personas && parseInt(p.personas) > 0);
    const hasSelections = orderData.panes?.length > 0 && orderData.rellenos?.length > 0;
    const isValid = orderData.deliveryDate && orderData.deliveryTime &&
        orderData.peopleCount &&
        (isBase ? hasPisos : hasSelections);

    if (loading) return <div className="p-8 text-center"><Loader2 className="animate-spin text-pink-500 mx-auto" /></div>;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <span className="bg-pink-100 text-pink-600 w-8 h-8 rounded-full flex items-center justify-center text-sm">B</span>
                Detalles del Pedido Principal
            </h2>

            {/* 1. Date & Time */}
            <div className="grid md:grid-cols-2 gap-6 bg-gray-50 p-6 rounded-2xl border border-gray-100">
                <div>
                    <label className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                        <Calendar size={16} className="text-pink-500" /> Fecha de Entrega
                    </label>
                    <input
                        type="date"
                        value={orderData.deliveryDate || ''}
                        onChange={(e) => updateOrder({ deliveryDate: e.target.value })}
                        className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500"
                    />
                </div>
                <div>
                    <label className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                        <Clock size={16} className="text-pink-500" /> Hora de Entrega
                    </label>
                    <div className="flex gap-2">
                        <select
                            className="bg-white p-3 border border-gray-300 rounded-xl flex-1"
                            value={parsedTime.hour}
                            onChange={(e) => handleTimeChange('hour', e.target.value)}
                        >
                            {hours.map(h => <option key={h} value={h}>{h}</option>)}
                        </select>
                        <span className="self-center font-bold">:</span>
                        <select
                            className="bg-white p-3 border border-gray-300 rounded-xl flex-1"
                            value={parsedTime.minute}
                            onChange={(e) => handleTimeChange('minute', e.target.value)}
                        >
                            {minutes.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                        <select
                            className="bg-white p-3 border border-gray-300 rounded-xl w-20"
                            value={parsedTime.period}
                            onChange={(e) => handleTimeChange('period', e.target.value)}
                        >
                            {periods.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            {/* 2. Type & Specs */}
            <div className="grid md:grid-cols-3 gap-6">
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Tipo de Folio</label>
                    <div className="flex bg-gray-100 p-1 rounded-xl">
                        <button
                            className={`flex-1 py-2 rounded-lg text-sm font-bold transition ${!isBase ? 'bg-white text-pink-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            onClick={() => updateOrder({ tipo_folio: 'Normal' })}
                        >
                            Normal
                        </button>
                        <button
                            className={`flex-1 py-2 rounded-lg text-sm font-bold transition ${isBase ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            onClick={() => {
                                updateOrder({ tipo_folio: 'Base' });
                                if (!orderData.pisos || orderData.pisos.length === 0) {
                                    const fixedPisos = Array.from({ length: 8 }, () => ({ personas: '', panes: [], rellenos: [], notas: '' }));
                                    updateOrder({ pisos: fixedPisos });
                                }
                            }}
                        >
                            Base / Especial
                        </button>
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Número de Personas {isBase && "(Total)"}</label>
                    <input
                        type="number"
                        value={orderData.peopleCount || ''}
                        onChange={(e) => updateOrder({ peopleCount: e.target.value })}
                        className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500"
                        placeholder="Ej. 20"
                    />
                </div>
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Forma</label>
                    {/* 🔥 SELECT DINÁMICO DESDE LA BASE DE DATOS */}
                    <select
                        className="w-full p-3 border border-gray-300 rounded-xl bg-white"
                        value={orderData.shape || ''}
                        onChange={(e) => updateOrder({ shape: e.target.value })}
                    >
                        <option value="">Seleccione forma...</option>
                        {shapes.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                    </select>
                </div>
            </div>

            {/* 3. Flavors & Fillings OR Pisos Structure */}
            {!isBase ? (
                <div className="grid md:grid-cols-2 gap-6">
                    <div>
                        <label className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                            <Cake size={16} /> Sabores de Pan (Máx 3)
                        </label>
                        <div className="flex flex-wrap gap-1 mb-2">
                            {(orderData.panes || []).map((pan, i) => (
                                <span key={i} className="inline-flex items-center gap-1 bg-purple-100 text-purple-700 text-xs font-bold px-2 py-1 rounded-md">
                                    {pan}
                                    <button 
                                        type="button" 
                                        onClick={() => {
                                            const newList = [...(orderData.panes || [])];
                                            newList.splice(i, 1);
                                            updateOrder({ panes: newList });
                                        }} 
                                        className="text-purple-400 hover:text-red-500 rounded-full bg-white p-0.5"
                                    >
                                        <X size={10} />
                                    </button>
                                </span>
                            ))}
                        </div>
                        <select
                            className="w-full p-3 border border-gray-300 rounded-xl bg-white mb-2"
                            value=""
                            onChange={(e) => {
                                const val = e.target.value;
                                if (!val) return;
                                const current = orderData.panes || [];
                                if (current.length >= 3) {
                                    import('react-hot-toast').then(m => m.default.error('Máximo 3 sabores de pan'));
                                    return;
                                }
                                if (!current.includes(val)) {
                                    updateOrder({ panes: [...current, val] });
                                }
                            }}
                        >
                            <option value="">+ Agregar sabor de pan...</option>
                            {flavors.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                            <Layers size={16} /> Rellenos (Máx 2)
                        </label>
                        <div className="flex flex-wrap gap-1 mb-2">
                            {(orderData.rellenos || []).map((rell, i) => (
                                <span key={i} className="inline-flex items-center gap-1 bg-pink-100 text-pink-700 text-xs font-bold px-2 py-1 rounded-md">
                                    {rell}
                                    <button 
                                        type="button" 
                                        onClick={() => {
                                            const newList = [...(orderData.rellenos || [])];
                                            newList.splice(i, 1);
                                            updateOrder({ rellenos: newList });
                                        }} 
                                        className="text-pink-400 hover:text-red-500 rounded-full bg-white p-0.5"
                                    >
                                        <X size={10} />
                                    </button>
                                </span>
                            ))}
                        </div>
                        <select
                            className="w-full p-3 border border-gray-300 rounded-xl bg-white mb-2"
                            value=""
                            onChange={(e) => {
                                const val = e.target.value;
                                if (!val) return;
                                const current = orderData.rellenos || [];
                                if (current.length >= 2) {
                                    import('react-hot-toast').then(m => m.default.error('Máximo 2 rellenos'));
                                    return;
                                }
                                if (!current.includes(val)) {
                                    updateOrder({ rellenos: [...current, val] });
                                }
                            }}
                        >
                            <option value="">+ Agregar relleno...</option>
                            {fillings.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}
                        </select>
                    </div>
                </div>
            ) : (
                <div className="bg-purple-50/50 p-6 rounded-2xl border border-purple-100">
                    <h3 className="text-lg font-bold text-purple-800 border-b border-purple-200 pb-2 mb-4 flex items-center gap-2">
                        <Layers size={20} className="text-purple-600" /> Estructura por Pisos (Máximo 8)
                    </h3>
                    <p className="text-[10px] text-purple-400 mb-4 italic">El bot llenará solo los pisos necesarios. Los campos vacíos serán ignorados.</p>
                    
                    <div className="space-y-4">
                        {localPisos.map((piso, idx) => (
                            <div key={idx} className="bg-white p-4 rounded-xl border border-purple-100 shadow-sm relative group">
                                <span className="absolute -top-2 -left-2 bg-purple-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                                    PISO {idx + 1}
                                </span>
                                <div className="grid md:grid-cols-4 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-bold text-purple-400 uppercase tracking-widest mb-1">Personas</label>
                                        <input 
                                            type="number" 
                                            value={piso.personas} 
                                            onChange={(e) => handleUpdatePiso(idx, 'personas', e.target.value)} 
                                            className="w-full py-2 px-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-400 outline-none text-sm" 
                                            placeholder="Ej. 10"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-purple-400 uppercase tracking-widest mb-1">Panes (Máx 3)</label>
                                        <div className="flex flex-wrap gap-1 mb-2">
                                            {(Array.isArray(piso.panes) ? piso.panes : (piso.panes ? [piso.panes] : [])).map((pan, i) => (
                                                <span key={i} className="inline-flex items-center gap-1 bg-purple-100 text-purple-700 text-xs font-bold px-2 py-1 rounded-md">
                                                    {pan}
                                                    <button type="button" onClick={() => handleRemoveItem(idx, 'panes', i)} className="text-purple-400 hover:text-red-500 rounded-full bg-white p-0.5"><X size={10} /></button>
                                                </span>
                                            ))}
                                        </div>
                                        <select 
                                            value="" 
                                            onChange={(e) => handleAddItem(idx, 'panes', e.target.value)} 
                                            className="w-full py-2 px-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-400 outline-none text-sm bg-white" 
                                        >
                                            <option value="">+ Agregar pan...</option>
                                            {flavors.map(f => (
                                                <option key={f.id} value={f.name}>{f.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-purple-400 uppercase tracking-widest mb-1">Rellenos (Máx 2)</label>
                                        <div className="flex flex-wrap gap-1 mb-2">
                                            {(Array.isArray(piso.rellenos) ? piso.rellenos : (piso.rellenos ? [piso.rellenos] : [])).map((relleno, i) => (
                                                <span key={i} className="inline-flex items-center gap-1 bg-pink-100 text-pink-700 text-xs font-bold px-2 py-1 rounded-md">
                                                    {relleno}
                                                    <button type="button" onClick={() => handleRemoveItem(idx, 'rellenos', i)} className="text-pink-400 hover:text-red-500 rounded-full bg-white p-0.5"><X size={10} /></button>
                                                </span>
                                            ))}
                                        </div>
                                        <select 
                                            value="" 
                                            onChange={(e) => handleAddItem(idx, 'rellenos', e.target.value)} 
                                            className="w-full py-2 px-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-400 outline-none text-sm bg-white" 
                                        >
                                            <option value="">+ Agregar relleno...</option>
                                            {fillings.map(f => (
                                                <option key={f.id} value={f.name}>{f.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        {/* 🔥 SOLUCIÓN: Etiqueta "Notas" y placeholder limpios */}
                                        <label className="block text-[10px] font-bold text-purple-400 uppercase tracking-widest mb-1">Notas</label>
                                        <div className="flex gap-2 relative">
                                            <input 
                                                type="text" 
                                                value={piso.notas} 
                                                onChange={(e) => handleUpdatePiso(idx, 'notas', e.target.value)} 
                                                className="w-full py-2 px-3 pr-10 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-400 outline-none text-sm" 
                                                placeholder="Dicta la nota..." 
                                            />
                                            <button 
                                                type="button"
                                                onClick={() => startDictation(idx)}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 text-purple-400 hover:text-purple-600 transition"
                                                title="Dictar nota por voz"
                                            >
                                                <Mic size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="flex justify-between pt-4">
                <button
                    onClick={prev}
                    className="px-6 py-3 text-gray-600 font-bold hover:bg-gray-100 rounded-xl transition"
                >
                    Atrás
                </button>
                <button
                    onClick={next}
                    disabled={!isValid}
                    className="bg-pink-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg shadow-pink-200"
                >
                    Siguiente
                </button>
            </div>
        </div>
    );
};

export default StepB_OrderDetails;