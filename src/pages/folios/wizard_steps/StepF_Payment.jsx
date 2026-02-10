import React, { useState, useEffect } from 'react';
import { useOrder } from '../../../context/OrderContext';
import { Calculator, CheckCircle, DollarSign, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import foliosApi from '../../../services/folios';

const StepF_Payment = ({ prev }) => {
    const { orderData, updateOrder } = useOrder();
    const navigate = useNavigate();
    const [submitting, setSubmitting] = useState(false);
    const [addCommission, setAddCommission] = useState(false);

    // Calculate Totals automatically
    const baseCost = parseFloat(orderData.costo_base || 0);
    const shipping = parseFloat(orderData.costo_envio || 0);
    const extrasTotal = (orderData.extras || []).reduce((acc, curr) => acc + (curr.qty * curr.price), 0);
    const complementsTotal = (orderData.complements || []).reduce((acc, curr) => acc + (parseFloat(curr.precio) || 0), 0);

    const subTotal = baseCost + shipping + extrasTotal + complementsTotal;

    // Commission Logic (e.g. +3.5% + $4 for card payment?)
    // User requested: "Agregar comisión al cliente" (Debe recalcular el Total y la Resta al activarse).
    // Let's assume standard card commission ~3-4%. Or input field? 
    // Let's implement as a fixed percentage logic for now (e.g., 3.6% + IVA on commission?) 
    // Simplified: 4% markup.
    const commissionAmount = addCommission ? (subTotal * 0.04) : 0;

    const total = subTotal + commissionAmount;
    const advance = parseFloat(orderData.anticipo || 0);
    const remaining = total - advance;

    // Sync total to context only when leaving or submitting (to avoid re-renders loop if we update state inside render)
    // Actually we can update state on effect if changed
    useEffect(() => {
        if (orderData.total !== total) {
            // Avoid infinite loop by check
            // updateOrder({ total }); // This mimics the effect, but might cause render loop if strict.
            // Better to just calculate derived state for display, and save correct total on submit.
        }
    }, [subTotal, commissionAmount]);


    const handlePaidInFull = (e) => {
        if (e.target.checked) {
            updateOrder({ anticipo: total, isPaidInFull: true });
        } else {
            updateOrder({ isPaidInFull: false }); // keep old advance or 0? Keep old.
        }
    };

    const handleFinish = async () => {
        setSubmitting(true);
        try {
            // CONSTRUCT PAYLOAD
            const payload = {
                // Client
                cliente_nombre: orderData.clientName,
                cliente_telefono: orderData.clientPhone,
                cliente_telefono_extra: orderData.clientPhoneExtra,
                clientId: orderData.selectedClient?.id || null, // Allow Null

                // Order Details
                fecha_entrega: orderData.deliveryDate,
                hora_entrega: orderData.deliveryTime,
                tipo_folio: orderData.tipo_folio,
                forma: orderData.shape,
                numero_personas: orderData.peopleCount,

                // Products / Flavors
                sabores_pan: [orderData.flavorText, ...(orderData.otherFlavors || [])].filter(Boolean),
                rellenos: [orderData.fillingText, ...(orderData.otherFillings || [])].filter(Boolean),
                flavorIds: orderData.flavorId ? [orderData.flavorId] : [], // Legacy support
                fillingIds: orderData.fillingId ? [orderData.fillingId] : [],

                // Arrays
                complements: orderData.complements,
                // Accessories needs mapping to DB JSON or separate model? 
                // DB has `accesorios` JSON.
                accesorios: orderData.extras,

                // Design
                descripcion_diseno: orderData.designDescription,
                dedicatoria: orderData.dedication,
                altura_extra: orderData.extraHeight ? 'Si' : 'No',
                imagen_referencia_url: orderData.referenceImages?.[0] || null, // First one as main
                diseno_metadata: {
                    allImages: orderData.referenceImages,
                    aiAnalysis: orderData.aiAnalysisResult
                },

                // Logistics
                is_delivery: orderData.is_delivery,
                calle: orderData.calle,
                num_ext: orderData.num_ext,
                colonia: orderData.colonia,
                referencias: orderData.referencias,
                ubicacion_maps: orderData.ubicacion_maps,
                costo_envio: shipping,

                // Finances
                costo_base: baseCost,
                total: total,
                anticipo: advance,
                estatus_pago: (remaining <= 0) ? 'Pagado' : 'Pendiente',
                status: 'CONFIRMED'
            };

            const newFolio = await foliosApi.createFolio(payload);
            toast.success('¡Pedido creado exitosamente!');
            navigate(`/folios/${newFolio.id}`);

        } catch (error) {
            console.error(error);
            toast.error('Error al guardar pedido. Verifica los datos.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <span className="bg-pink-100 text-pink-600 w-8 h-8 rounded-full flex items-center justify-center text-sm">F</span>
                Liquidación y Cuenta
            </h2>

            <div className="grid md:grid-cols-2 gap-8">
                {/* Breakdown */}
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-3">
                    <h3 className="font-bold text-gray-700 border-b pb-2 mb-2">Desglose</h3>
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Costo Base Pastel</span>
                        <input
                            type="number"
                            value={orderData.costo_base || 0}
                            onChange={(e) => updateOrder({ costo_base: parseFloat(e.target.value) || 0 })}
                            className="w-24 p-1 border rounded text-right font-medium"
                        />
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Complementos ({orderData.complements?.length || 0})</span>
                        <span className="font-medium">${complementsTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Extras / Accesorios</span>
                        <span className="font-medium">${extrasTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Envío</span>
                        <span className="font-medium">${shipping.toFixed(2)}</span>
                    </div>

                    <div className="border-t pt-2 mt-2">
                        <div className="flex items-center justify-between">
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    checked={addCommission}
                                    onChange={(e) => setAddCommission(e.target.checked)}
                                    className="rounded text-pink-600 focus:ring-pink-500"
                                />
                                <span className="text-sm font-bold text-blue-600">Agregar Comisión (4%)</span>
                            </label>
                            {addCommission && <span className="text-blue-600 font-bold">+${commissionAmount.toFixed(2)}</span>}
                        </div>
                    </div>

                    <div className="flex justify-between text-xl font-black text-gray-800 border-t pt-3 mt-2">
                        <span>TOTAL</span>
                        <span>${total.toFixed(2)}</span>
                    </div>
                </div>

                {/* Payments */}
                <div className="space-y-6">
                    <div className="bg-green-50 p-6 rounded-2xl border border-green-200">
                        <label className="block text-sm font-bold text-green-800 mb-2">Anticipo Recibido</label>
                        <div className="relative">
                            <DollarSign className="absolute left-3 top-3.5 text-green-600" size={20} />
                            <input
                                type="number"
                                value={orderData.anticipo || ''}
                                onChange={(e) => updateOrder({ anticipo: parseFloat(e.target.value) || 0 })}
                                className="w-full pl-10 p-4 border border-green-300 rounded-xl text-2xl font-bold text-green-900 focus:ring-2 focus:ring-green-500 bg-white"
                            />
                        </div>

                        <label className="flex items-center gap-2 mt-4 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={orderData.isPaidInFull || (advance >= total && total > 0)}
                                onChange={handlePaidInFull}
                                className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
                            />
                            <span className="font-bold text-green-800">Pedido Pagado en su Totalidad</span>
                        </label>
                    </div>

                    <div className="bg-gray-100 p-6 rounded-2xl text-center">
                        <p className="text-sm font-bold text-gray-500 uppercase">Resta por Pagar</p>
                        <p className={`text-4xl font-black ${remaining > 0 ? 'text-red-500' : 'text-gray-400'}`}>
                            ${Math.max(0, remaining).toFixed(2)}
                        </p>
                    </div>
                </div>
            </div>

            <div className="flex justify-between pt-8 border-t border-gray-100 mt-8">
                <button onClick={prev} className="px-6 py-3 text-gray-600 font-bold hover:bg-gray-100 rounded-xl transition">Atrás</button>
                <button
                    onClick={handleFinish}
                    disabled={submitting}
                    className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-10 py-4 rounded-xl font-bold hover:shadow-xl hover:scale-105 transition flex items-center gap-3 shadow-lg shadow-green-200"
                >
                    {submitting ? <Loader2 className="animate-spin" /> : <CheckCircle size={24} />}
                    {submitting ? 'Guardando...' : 'Finalizar Pedido'}
                </button>
            </div>
        </div>
    );
};

export default StepF_Payment;
