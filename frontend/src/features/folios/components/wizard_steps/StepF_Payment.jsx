import React, { useState, useEffect } from 'react';
import { useOrder } from '@/context/OrderContext';
import { Calculator, CheckCircle, DollarSign, Loader2, X, Save, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import foliosApi from '@/features/folios/api/folios.api';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const StepF_Payment = ({ prev }) => {
    const { orderData, updateOrder } = useOrder();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [addCommission, setAddCommission] = useState(false);

    // Calculate Totals automatically
    const baseCost = parseFloat(orderData.costo_base || 0);
    const shipping = parseFloat(orderData.costo_envio || 0);
    const extrasTotal = (orderData.extras || []).reduce((acc, curr) => acc + (curr.qty * curr.price), 0);
    const complementsTotal = (orderData.complements || []).reduce((acc, curr) => acc + (parseFloat(curr.precio) || 0), 0);

    const subTotal = baseCost + shipping + extrasTotal + complementsTotal;
    const commissionAmount = addCommission ? (subTotal * 0.04) : 0;

    const total = subTotal + commissionAmount;
    const advance = parseFloat(orderData.anticipo || 0);
    const remaining = total - advance;

    const handlePaidInFull = (e) => {
        if (e.target.checked) {
            updateOrder({ anticipo: total, isPaidInFull: true });
        } else {
            updateOrder({ isPaidInFull: false });
        }
    };

    const mutation = useMutation({
        mutationFn: async (vars) => {
            if (vars.id) {
                const { id, ...data } = vars;
                return await foliosApi.updateFolio(id, data);
            }
            return await foliosApi.createFolio(vars);
        },
        onSuccess: (result) => {
            const isUpdate = !!orderData.id;
            toast.success(isUpdate ? '¡Pedido actualizado!' : '¡Pedido creado!');
            
            queryClient.invalidateQueries({ queryKey: ['folios'] });
            if (orderData.id) queryClient.invalidateQueries({ queryKey: ['folios', orderData.id] });
            
            navigate(`/folios/${result?.id || orderData.id}`);
        },
        onError: (error) => {
            console.error(error);
            const errorMessage = error.response?.data?.message || 'Error al guardar';
            toast.error(`Error: ${errorMessage}`);
        }
    });

    const handleFinish = () => {
        // 🔒 Preparamos los datos estrictamente para Zod y MySQL
        const complementariosList = (orderData.complements || [])
            .filter(c => c.sabor || (c.personas && parseInt(c.personas) > 0))
            .map(c => ({
                numero_personas: parseInt(c.personas) || 0,
                forma: c.forma || 'Redondo',
                sabores_pan: c.sabor ? [c.sabor] : [],
                rellenos: c.relleno ? [c.relleno] : [],
                descripcion: c.descripcion || ''
            }));

        let hora_limpia = orderData.deliveryTime || '';
        if (hora_limpia.length > 5) hora_limpia = hora_limpia.substring(0, 5); 

        // 🛡️ SANITIZADOR DE TIPO DE FOLIO (El que faltaba)
        let tipoFolioSeguro = orderData.tipo_folio || 'Normal';
        if (tipoFolioSeguro === 'Base' || tipoFolioSeguro === 'Especial') {
            tipoFolioSeguro = 'Base/Especial';
        }

        const payload = {
            cliente_nombre: orderData.clientName,
            cliente_telefono: orderData.clientPhone,
            clientId: orderData.clientId || null,

            fecha_entrega: orderData.deliveryDate,
            hora_entrega: hora_limpia,
            
            // 🔥 AQUÍ ENVIAMOS LA VARIABLE SANITIZADA PARA ZOD
            tipo_folio: tipoFolioSeguro, 
            forma: orderData.shape,
            numero_personas: orderData.peopleCount,

            sabores_pan: orderData.panes,
            rellenos: orderData.rellenos,

            complementarios: complementariosList,
            accesorios: orderData.extras,

            descripcion_diseno: orderData.descripcion_diseno,
            dedicatoria: orderData.dedicatoria,
            imagen_referencia_url: orderData.imagen_referencia_url,
            diseno_metadata: {
                pisos: (orderData.pisos || []).filter(p => p.personas && parseInt(p.personas) > 0),
                allImages: orderData.referenceImages
            },

            is_delivery: orderData.is_delivery || orderData.isDelivery, // Soporte a ambas llaves
            calle: orderData.calle,
            colonia: orderData.colonia,
            referencias: orderData.referencias,
            costo_envio: shipping,

            costo_base: baseCost,
            totalValue: total,
            total: total,
            anticipo: advance,
            estatus_pago: (remaining <= 0) ? 'Pagado' : 'Pendiente',
            status: 'CONFIRMED'
        };

        if (orderData.id) {
            mutation.mutate({ id: orderData.id, ...payload });
        } else {
            mutation.mutate(payload);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <span className="bg-pink-100 text-pink-600 w-8 h-8 rounded-full flex items-center justify-center text-sm">F</span>
                Liquidación y Cuenta
            </h2>

            <div className="grid md:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-3">
                    <h3 className="font-bold text-gray-700 border-b pb-2 mb-2">Desglose</h3>
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Costo Base Pastel</span>
                        <input
                            type="number"
                            value={orderData.costo_base ?? ''}
                            onChange={(e) => updateOrder({ costo_base: parseFloat(e.target.value) || 0 })}
                            className="w-24 p-1 border rounded text-right font-medium"
                        />
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Complementos</span>
                        <span className="font-medium">${complementsTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Extras</span>
                        <span className="font-medium">${extrasTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Envío</span>
                        <span className="font-medium">${shipping.toFixed(2)}</span>
                    </div>

                    <div className="border-t pt-2 mt-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={addCommission}
                                onChange={(e) => setAddCommission(e.target.checked)}
                                className="rounded text-pink-600"
                            />
                            <span className="text-sm font-bold text-blue-600">Comisión Tarjeta (4%)</span>
                        </label>
                    </div>

                    <div className="flex justify-between text-xl font-black text-gray-800 border-t pt-3 mt-2">
                        <span>TOTAL</span>
                        <span>${total.toFixed(2)}</span>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-green-50 p-6 rounded-2xl border border-green-200">
                        <label className="block text-sm font-bold text-green-800 mb-2">Anticipo Recibido</label>
                        <div className="relative">
                            <DollarSign className="absolute left-3 top-3.5 text-green-600" size={20} />
                            <input
                                type="number"
                                value={orderData.anticipo || ''}
                                onChange={(e) => updateOrder({ anticipo: parseFloat(e.target.value) || 0 })}
                                className="w-full pl-10 p-4 border border-green-300 rounded-xl text-2xl font-bold text-green-900 bg-white"
                            />
                        </div>
                        <label className="flex items-center gap-2 mt-4 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={orderData.isPaidInFull || (advance >= total && total > 0)}
                                onChange={handlePaidInFull}
                                className="w-5 h-5 text-green-600 rounded"
                            />
                            <span className="font-bold text-green-800">Pagado Total</span>
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
                    disabled={mutation.isPending}
                    className="bg-gradient-to-r from-pink-600 to-rose-600 text-white px-10 py-4 rounded-xl font-bold hover:shadow-xl transition flex items-center gap-3 shadow-lg"
                >
                    {mutation.isPending ? <Loader2 className="animate-spin" /> : <Check size={24} />}
                    {mutation.isPending ? 'Guardando...' : orderData.id ? 'Actualizar Pedido' : 'Finalizar Pedido'}
                </button>
            </div>
        </div>
    );
};

export default StepF_Payment;
