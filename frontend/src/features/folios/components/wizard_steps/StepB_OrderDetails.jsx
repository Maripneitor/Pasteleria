import React, { useState, useEffect } from 'react';
import { useOrder } from '@/context/OrderContext';
import { Calendar, Clock, Cake, Layers, Loader2, X, Mic, AlertCircle } from 'lucide-react';
import catalogApi from '@/features/catalogs/api/catalogs.api';

const StepB_OrderDetails = ({ next, prev }) => {
    const { orderData, updateOrder } = useOrder();
    const [flavors, setFlavors] = useState([]);
    const [fillings, setFillings] = useState([]);
    const [shapes, setShapes] = useState([]); 
    const [sizes, setSizes] = useState([]);   
    const [loading, setLoading] = useState(true);

    const [localPisos, setLocalPisos] = useState(() => {
        const ctxPisos = orderData.detallesPisos || orderData.pisos || [];
        const initial = Array.isArray(ctxPisos) ? ctxPisos : [];
        return Array.from({ length: 8 }, (_, i) => ({
            personas: '', panes: [], rellenos: [], notas: '',
            ...(initial[i] || {})
        }));
    });

    useEffect(() => {
        if (sizes.length === 0) return;

        const sourcePisos = orderData.detallesPisos || orderData.pisos || orderData.detalles_pisos;
        
        if (sourcePisos && localPisos.every(p => !p.personas)) {
            let loadedPisos = [];
            
            try {
                loadedPisos = typeof sourcePisos === 'string' ? JSON.parse(sourcePisos) : sourcePisos;
                if (typeof loadedPisos === 'object' && !Array.isArray(loadedPisos)) {
                    loadedPisos = Object.values(loadedPisos);
                }
            } catch (e) {
                console.error("Error parseando detallesPisos", e);
            }

            if (Array.isArray(loadedPisos) && loadedPisos.length > 0) {
                const mapped = Array.from({ length: 8 }, (_, i) => {
                    const piso = loadedPisos[i] || {};
                    
                    let personasVal = '';
                    if (piso.personas) {
                        const numStr = String(piso.personas).replace(/[^0-9]/g, '');
                        const matchSize = sizes.find(s => String(s.name).replace(/[^0-9]/g, '') === numStr);
                        personasVal = matchSize ? matchSize.name : String(piso.personas);
                    }

                    const parseArraySafe = (val) => {
                        if (!val) return [];
                        if (Array.isArray(val)) return val;
                        if (typeof val === 'string') return val.split(',').map(s => s.trim());
                        return [String(val)];
                    };

                    return {
                        personas: personasVal, 
                        panes: parseArraySafe(piso.panes || piso.pan || piso.flavor || piso.sabores), 
                        rellenos: parseArraySafe(piso.rellenos || piso.relleno || piso.filling), 
                        notas: piso.notas || piso.nota || piso.forma || piso.detalles || ''
                    };
                });
                
                setLocalPisos(mapped);
            }
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [orderData.detallesPisos, orderData.pisos, sizes]); 

    useEffect(() => {
        // 🚀 FIX: Forzamos la actualización de ambas variables para que 
        // el payload que viaja al backend no pierda la estructura original
        updateOrder({ pisos: localPisos, detallesPisos: localPisos });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [localPisos]);

    useEffect(() => {
        const load = async () => {
            try {
                const [f, c, sh, sz] = await Promise.all([
                    catalogApi.getFlavors(false).catch(() => []),
                    catalogApi.getFillings(false).catch(() => []),
                    catalogApi.getShapes('MAIN', false).catch(() => []),
                    catalogApi.getSizes('MAIN', false).catch(() => []) 
                ]);
                
                setFlavors(f);
                setFillings(c);
                setShapes(sh);
                setSizes(sz);
            } catch (e) {
                console.error("Error cargando catálogos en StepB:", e);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const getParsedTime = () => {
        const rawTime = orderData.deliveryTime || orderData.hora_entrega;
        if (!rawTime) return { hour: '', minute: '', period: '' };
        
        const timeClean = rawTime.replace(/[^0-9:]/g, ''); 
        if (!timeClean.includes(':')) return { hour: '', minute: '', period: '' };

        const [h24, m] = timeClean.split(':');
        let h = parseInt(h24, 10);
        if (isNaN(h)) return { hour: '', minute: '', period: '' };

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
        const newTime = { 
            hour: current.hour || '12', 
            minute: current.minute || '00', 
            period: current.period || 'PM' 
        };
        newTime[field] = value;
        
        let h = parseInt(newTime.hour, 10);
        if (newTime.period === 'PM' && h !== 12) h += 12;
        if (newTime.period === 'AM' && h === 12) h = 0;

        const hStr = h.toString().padStart(2, '0');
        updateOrder({ deliveryTime: `${hStr}:${newTime.minute}` }); 
    };

    const parsedTime = getParsedTime();
    const arrayPisosSafe = Array.isArray(orderData.detallesPisos) ? orderData.detallesPisos : [];
    const isBase = orderData.tipo_folio?.includes('Base') || orderData.tipo_folio?.includes('Especial') || arrayPisosSafe.length > 0;
    
    // 🔥 LÓGICA MATEMÁTICA RESTAURADA
    const getNumericSize = (sizeStr) => {
        if (!sizeStr) return 0;
        const num = parseInt(sizeStr.toString().replace(/[^0-9]/g, ''), 10);
        return isNaN(num) ? 0 : num;
    };

    const totalPersonas = getNumericSize(orderData.peopleCount || orderData.numero_personas);
    const sumPisos = localPisos.reduce((sum, p) => sum + getNumericSize(p.personas), 0);
    const remainingPersonas = totalPersonas - sumPisos;

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

        recognition.start();
    };

    const hours = Array.from({ length: 12 }, (_, i) => i + 1);
    const minutes = ['00', '15', '30', '45'];
    const periods = ['AM', 'PM'];

    const getMinDate = () => {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    };

    let mainSizeValue = orderData.peopleCount || orderData.numero_personas || '';
    if (mainSizeValue && sizes.length > 0) {
        const numStr = String(mainSizeValue).replace(/[^0-9]/g, '');
        const matchSize = sizes.find(s => String(s.name).replace(/[^0-9]/g, '') === numStr);
        if (matchSize) mainSizeValue = matchSize.name;
    }

    const hasPisos = isBase && localPisos.some(p => getNumericSize(p.personas) > 0);
    const currentPanes = orderData.panes || [];
    const currentRellenos = orderData.rellenos || [];
    const hasSelections = currentPanes.length > 0 && currentRellenos.length > 0;
    
    // Validamos que los pisos no sumen más del total
    const isPisosValid = hasPisos && (totalPersonas === 0 || sumPisos <= totalPersonas);

    const isValid = (orderData.deliveryDate || orderData.fecha_entrega) && 
                    (orderData.deliveryTime || orderData.hora_entrega) &&
                    (mainSizeValue) &&
                    (isBase ? isPisosValid : hasSelections);

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
                        min={getMinDate()}
                        value={orderData.deliveryDate || orderData.fecha_entrega || ''}
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
                            <option value="" disabled>Hora</option>
                            {hours.map(h => <option key={h} value={h}>{h}</option>)}
                        </select>
                        <span className="self-center font-bold text-gray-400">:</span>
                        <select
                            className="bg-white p-3 border border-gray-300 rounded-xl flex-1"
                            value={parsedTime.minute}
                            onChange={(e) => handleTimeChange('minute', e.target.value)}
                        >
                            <option value="" disabled>Min</option>
                            {minutes.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                        <select
                            className="bg-white p-3 border border-gray-300 rounded-xl w-24"
                            value={parsedTime.period}
                            onChange={(e) => handleTimeChange('period', e.target.value)}
                        >
                            <option value="" disabled>AM/PM</option>
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
                            onClick={() => updateOrder({ tipo_folio: 'Base/Especial' })}
                        >
                            Base / Especial
                        </button>
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Número de Personas {isBase && "(Total)"}</label>
                    <select
                        className="w-full p-3 border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-pink-500"
                        value={mainSizeValue}
                        onChange={(e) => updateOrder({ peopleCount: e.target.value })}
                    >
                        <option value="">Seleccione tamaño...</option>
                        {sizes.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Forma</label>
                    <select
                        className="w-full p-3 border border-gray-300 rounded-xl bg-white"
                        value={orderData.shape || orderData.forma || ''}
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
                            {currentPanes.map((pan, i) => (
                                <span key={i} className="inline-flex items-center gap-1 bg-purple-100 text-purple-700 text-xs font-bold px-2 py-1 rounded-md">
                                    {pan}
                                    <button 
                                        type="button" 
                                        onClick={() => {
                                            const newList = [...currentPanes];
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
                                if (currentPanes.length >= 3) {
                                    import('react-hot-toast').then(m => m.default.error('Máximo 3 sabores de pan'));
                                    return;
                                }
                                if (!currentPanes.includes(val)) {
                                    updateOrder({ panes: [...currentPanes, val] });
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
                            {currentRellenos.map((rell, i) => (
                                <span key={i} className="inline-flex items-center gap-1 bg-pink-100 text-pink-700 text-xs font-bold px-2 py-1 rounded-md">
                                    {rell}
                                    <button 
                                        type="button" 
                                        onClick={() => {
                                            const newList = [...currentRellenos];
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
                                if (currentRellenos.length >= 2) {
                                    import('react-hot-toast').then(m => m.default.error('Máximo 2 rellenos'));
                                    return;
                                }
                                if (!currentRellenos.includes(val)) {
                                    updateOrder({ rellenos: [...currentRellenos, val] });
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
                    <div className="flex items-center justify-between border-b border-purple-200 pb-2 mb-4">
                        <h3 className="text-lg font-bold text-purple-800 flex items-center gap-2">
                            <Layers size={20} className="text-purple-600" /> Estructura por Pisos (Máx 8)
                        </h3>
                        {/* 🔥 CONTADOR DE ASIGNACIONES RESTAURADO */}
                        {totalPersonas > 0 && (
                            <div className={`px-3 py-1 rounded-full text-xs font-bold shadow-sm transition-colors ${sumPisos === totalPersonas ? 'bg-green-100 text-green-700' : sumPisos > totalPersonas ? 'bg-red-100 text-red-700' : 'bg-purple-200 text-purple-800'}`}>
                                Asignadas: {sumPisos} / {totalPersonas}
                            </div>
                        )}
                    </div>

                    {/* 🔥 ALERTA DE EXCESO DE PISOS */}
                    {totalPersonas > 0 && sumPisos > totalPersonas && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm flex items-center gap-2 font-bold shadow-sm">
                            <AlertCircle size={18} /> Has superado el tamaño del pastel principal ({totalPersonas} personas).
                        </div>
                    )}

                    <div className="space-y-4">
                        {localPisos.map((piso, idx) => {
                            const pisoActualValue = getNumericSize(piso.personas);
                            const maxAllowedForThisSelect = remainingPersonas + pisoActualValue;

                            return (
                                <div key={idx} className="bg-white p-4 rounded-xl border border-purple-100 shadow-sm relative group hover:border-purple-300 transition-colors">
                                    <span className={`absolute -top-2 -left-2 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm ${pisoActualValue > 0 ? 'bg-purple-600' : 'bg-gray-400'}`}>
                                        PISO {idx + 1}
                                    </span>
                                    <div className="grid md:grid-cols-4 gap-4">
                                        <div>
                                            <label className="block text-[10px] font-bold text-purple-400 uppercase tracking-widest mb-1">Personas</label>
                                            <select 
                                                value={piso.personas || ''} 
                                                onChange={(e) => handleUpdatePiso(idx, 'personas', e.target.value)} 
                                                className="w-full py-2 px-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-400 outline-none text-sm bg-white"
                                            >
                                                <option value="">Seleccione...</option>
                                                {/* 🔥 FILTRO MATEMÁTICO RESTAURADO */}
                                                {sizes
                                                    .filter(s => {
                                                        if (totalPersonas === 0) return true; // Si no hay total, muestra todos
                                                        const sNum = getNumericSize(s.name);
                                                        return sNum > 0 && sNum <= maxAllowedForThisSelect;
                                                    })
                                                    .map(s => <option key={s.id} value={s.name}>{s.name}</option>)
                                                }
                                            </select>
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
                                            <label className="block text-[10px] font-bold text-purple-400 uppercase tracking-widest mb-1">Notas / Detalles</label>
                                            <div className="flex gap-2 relative">
                                                <input 
                                                    type="text" 
                                                    value={piso.notas} 
                                                    onChange={(e) => handleUpdatePiso(idx, 'notas', e.target.value)} 
                                                    className="w-full py-2 px-3 pr-10 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-400 outline-none text-sm" 
                                                    placeholder="Ej: Cuadrado, rosa..." 
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
                            );
                        })}
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
                    disabled={!isValid || (isBase && totalPersonas > 0 && sumPisos > totalPersonas)}
                    className="bg-pink-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg shadow-pink-200"
                >
                    Siguiente
                </button>
            </div>
        </div>
    );
};

export default StepB_OrderDetails;