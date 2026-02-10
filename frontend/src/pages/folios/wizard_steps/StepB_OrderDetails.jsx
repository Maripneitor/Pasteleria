import React, { useState, useEffect } from 'react';
import { useOrder } from '../../../context/OrderContext';
import { Calendar, Clock, Cake, Layers, Loader2 } from 'lucide-react';
import catalogApi from '../../../services/catalogApi';

const StepB_OrderDetails = ({ next, prev }) => {
    const { orderData, updateOrder } = useOrder();
    const [flavors, setFlavors] = useState([]);
    const [fillings, setFillings] = useState([]);
    const [loading, setLoading] = useState(true);

    // Load Catalogs
    useEffect(() => {
        const load = async () => {
            try {
                const [f, c] = await Promise.all([
                    catalogApi.getFlavors(false),
                    catalogApi.getFillings(false)
                ]);
                setFlavors(f);
                setFillings(c);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    // Helper for Time Picker (12h format as requested)
    const hours = Array.from({ length: 12 }, (_, i) => i + 1);
    const minutes = ['00', '15', '30', '45'];
    const periods = ['AM', 'PM'];

    const [selectedTime, setSelectedTime] = useState({
        hour: '12',
        minute: '00',
        period: 'PM'
    });

    // Update main time string when parts change
    useEffect(() => {
        const { hour, minute, period } = selectedTime;
        // Convert to 24h for consistency in backend if needed, or keep string?
        // User asked for specific selector. Let's store as string "HH:mm AM/PM" or "HH:mm" (24h).
        // Standardizing on "HH:mm" (24h) is safer for backend, but UI shows 12h.

        let h = parseInt(hour);
        if (period === 'PM' && h !== 12) h += 12;
        if (period === 'AM' && h === 12) h = 0;

        const hStr = h.toString().padStart(2, '0');
        const timeStr = `${hStr}:${minute}`; // 24h format

        if (timeStr !== orderData.deliveryTime) {
            updateOrder({ deliveryTime: timeStr });
        }
    }, [selectedTime]);

    // Validation
    const isValid = orderData.deliveryDate && orderData.deliveryTime &&
        orderData.flavorId && orderData.fillingId && // At least one
        orderData.peopleCount; // Required per prompt Section B

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
                    <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
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
                    <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                        <Clock size={16} className="text-pink-500" /> Hora de Entrega
                    </label>
                    <div className="flex gap-2">
                        <select
                            className="bg-white p-3 border border-gray-300 rounded-xl flex-1"
                            value={selectedTime.hour}
                            onChange={(e) => setSelectedTime({ ...selectedTime, hour: e.target.value })}
                        >
                            {hours.map(h => <option key={h} value={h}>{h}</option>)}
                        </select>
                        <span className="self-center font-bold">:</span>
                        <select
                            className="bg-white p-3 border border-gray-300 rounded-xl flex-1"
                            value={selectedTime.minute}
                            onChange={(e) => setSelectedTime({ ...selectedTime, minute: e.target.value })}
                        >
                            {minutes.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                        <select
                            className="bg-white p-3 border border-gray-300 rounded-xl w-20"
                            value={selectedTime.period}
                            onChange={(e) => setSelectedTime({ ...selectedTime, period: e.target.value })}
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
                            className={`flex-1 py-2 rounded-lg text-sm font-bold transition ${orderData.tipo_folio !== 'Base' ? 'bg-white text-pink-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            onClick={() => updateOrder({ tipo_folio: 'Normal' })}
                        >
                            Normal
                        </button>
                        <button
                            className={`flex-1 py-2 rounded-lg text-sm font-bold transition ${orderData.tipo_folio === 'Base' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            onClick={() => updateOrder({ tipo_folio: 'Base' })}
                        >
                            Base / Especial
                        </button>
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Número de Personas</label>
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
                    <select
                        className="w-full p-3 border border-gray-300 rounded-xl bg-white"
                        value={orderData.shape || 'Redondo'}
                        onChange={(e) => updateOrder({ shape: e.target.value })}
                    >
                        <option value="Redondo">Redondo</option>
                        <option value="Cuadrado">Cuadrado</option>
                        <option value="Rectangular">Rectangular</option>
                        <option value="Corazon">Corazón</option>
                    </select>
                </div>
            </div>

            {/* 3. Flavors & Fillings (Max 2) */}
            <div className="grid md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                        <Cake size={16} /> Sabores de Pan (Máx 2)
                    </label>
                    <select
                        className="w-full p-3 border border-gray-300 rounded-xl bg-white mb-2"
                        value={orderData.flavorId || ''}
                        onChange={(e) => {
                            // Simple selection for primary logic, can expand to array if needed
                            const id = e.target.value;
                            const flav = flavors.find(f => f.id.toString() === id);
                            updateOrder({ flavorId: id, flavorText: flav?.name });
                        }}
                    >
                        <option value="">Seleccione Principal...</option>
                        {flavors.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                    </select>
                    {/* Secondary Flavor Logic could go here (e.g. array push) */}
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                        <Layers size={16} /> Rellenos (Máx 2)
                    </label>
                    <select
                        className="w-full p-3 border border-gray-300 rounded-xl bg-white mb-2"
                        value={orderData.fillingId || ''}
                        onChange={(e) => {
                            const id = e.target.value;
                            const fill = fillings.find(f => f.id.toString() === id);
                            updateOrder({ fillingId: id, fillingText: fill?.name });
                        }}
                    >
                        <option value="">Seleccione Principal...</option>
                        {fillings.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                    </select>
                </div>
            </div>

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
                    Siguiente (Complementos) arrow_forward
                </button>
            </div>
        </div>
    );
};

export default StepB_OrderDetails;
