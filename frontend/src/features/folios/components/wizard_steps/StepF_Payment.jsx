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
        // 1. Preparar Pisos
        const detallesPisos = (orderData.pisos || [])
            .filter(p => p.personas && parseInt(p.personas) > 0)
            .map((p, index) => ({
                piso: index + 1,
                personas: p.personas,
                sabores_pan: Array.isArray(p.panes) ? p.panes : [p.panes].filter(Boolean),
                rellenos: Array.isArray(p.rellenos) ? p.rellenos : [p.rellenos].filter(Boolean),
                notas: p.notas || ''
            }));

        // 2. Preparar Complementarios
        const complementariosList = (orderData.complements || [])
            .filter(c => c.sabor || (c.personas && parseInt(c.personas) > 0))
            .map(c => ({
                numero_personas: parseInt(c.personas) || 0,
                forma: c.forma || '',
                sabores_pan: Array.isArray(c.sabor) ? c.sabor : [c.sabor].filter(Boolean),
                rellenos: Array.isArray(c.relleno) ? c.relleno : [c.relleno].filter(Boolean),
                descripcion: c.descripcion || '',
                precio: parseFloat(c.precio) || 0
            }));

        // 3. Preparar Accesorios
        const accesoriosList = (orderData.extras || []).map(e => ({
            name: e.name,
            price: parseFloat(e.price) || 0,
            qty: parseInt(e.qty) || 1
        }));

        // 4. Armar la dirección completa si es envío (AHORA SÍ CON NUM_EXT)
        let ubicacion_entrega = 'Recolección en tienda';
        if (orderData.is_delivery) {
            ubicacion_entrega = `${orderData.calle || ''} ${orderData.num_ext || ''}, ${orderData.colonia || ''}. Ref: ${orderData.referencias || ''}`.trim();
        }

        // 5. Sanitizador de Tipo de Folio
        const validTipos = ['Normal', 'Base/Especial', 'Express', 'Mayoreo'];
        let tipoFolioSeguro = orderData.tipo_folio;
        if (tipoFolioSeguro === 'Base' || tipoFolioSeguro === 'Especial') {
            tipoFolioSeguro = 'Base/Especial';
        } else if (typeof tipoFolioSeguro === 'string') {
            tipoFolioSeguro = tipoFolioSeguro.charAt(0).toUpperCase() + tipoFolioSeguro.slice(1).toLowerCase();
        }
        if (!validTipos.includes(tipoFolioSeguro)) {
            tipoFolioSeguro = 'Normal';
        }

        const payload = {
            // --- CLIENTE ---
            cliente_nombre: orderData.clientName,
            cliente_telefono: orderData.clientPhone,
            cliente_telefono_extra: orderData.clientPhoneExtra || '', // Agregado
            clientId: orderData.clientId || null,

            // --- LOGÍSTICA (AHORA SÍ MANDA TODO) ---
            fecha_entrega: orderData.deliveryDate,
            hora_entrega: orderData.deliveryTime,
            is_delivery: orderData.is_delivery || false,
            ubicacion_entrega: ubicacion_entrega,
            calle: orderData.calle || '',
            num_ext: orderData.num_ext || '',
            colonia: orderData.colonia || '',
            referencias: orderData.referencias || '',
            ubicacion_maps: orderData.ubicacion_maps || '',
            costo_envio: parseFloat(orderData.costo_envio || 0),

            // --- PRODUCTO PRINCIPAL ---
            tipo_folio: tipoFolioSeguro, 
            forma: orderData.shape || '',
            numero_personas: parseInt(orderData.peopleCount) || 0,
            altura_extra: orderData.extraHeight ? 'Si' : 'No', // Agregado el dato del Paso D
            sabores_pan: Array.isArray(orderData.panes) ? orderData.panes : [orderData.panes].filter(Boolean),
            rellenos: Array.isArray(orderData.rellenos) ? orderData.rellenos : [orderData.rellenos].filter(Boolean),

            // --- ARREGLOS AVANZADOS ---
            detallesPisos: detallesPisos,
            complementarios: complementariosList,
            accesorios: accesoriosList, 

            // --- DISEÑO ---
            descripcion_diseno: orderData.descripcion_diseno || '',
            dedicatoria: orderData.dedicatoria || '',
            imagen_referencia_url: orderData.imagen_referencia_url || '',
            diseno_metadata: {
                allImages: orderData.referenceImages || []
            },

            // --- FINANCIERO ---
            costo_base: parseFloat(orderData.costo_base || 0),
            total: total,
            anticipo: advance,
            estatus_pago: (remaining <= 0) ? 'Pagado' : 'Pendiente',
            estatus_produccion: 'Pendiente'
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
