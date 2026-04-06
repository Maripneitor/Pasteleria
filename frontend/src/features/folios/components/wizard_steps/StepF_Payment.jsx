import React, { useState } from 'react';
import { useOrder } from '@/context/OrderContext';
import { Calculator, CheckCircle, DollarSign, Loader2, X, Save, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import foliosApi from '@/features/folios/api/folios.api';
import { useMutation, useQueryClient } from '@tanstack/react-query';

// 🔥 Helper Blindado para números (Evita NaNs y redondea a 2 decimales para MySQL)
const getValidMoney = (val) => {
    const parsed = parseFloat(val);
    return isNaN(parsed) ? 0 : Number(parsed.toFixed(2));
};

const StepF_Payment = ({ prev }) => {
    const { orderData, updateOrder } = useOrder();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    
    const [nuevoAbono, setNuevoAbono] = useState(''); 

    // --- CÁLCULOS MATEMÁTICOS SEGUROS ---
    const baseCost = getValidMoney(orderData.costo_base);
    const shipping = getValidMoney(orderData.costo_envio);
    
    const extrasTotal = (orderData.extras || []).reduce((acc, curr) => {
        const p = getValidMoney(curr.precio || curr.price);
        const q = parseInt(curr.cantidad || curr.qty, 10) || 1;
        return acc + (p * q);
    }, 0);
    
    const complementsTotal = (orderData.complements || []).reduce((acc, curr) => acc + getValidMoney(curr.precio), 0);

    const subTotal = baseCost + shipping + extrasTotal + complementsTotal;
    const commissionAmount = orderData.aplica_comision ? getValidMoney(subTotal * 0.04) : 0;
    const total = getValidMoney(subTotal + commissionAmount);

    const historicalAdvance = getValidMoney(orderData.anticipo); 
    const currentNewAbono = getValidMoney(nuevoAbono); 
    const totalPaid = getValidMoney(historicalAdvance + currentNewAbono);
    const remaining = getValidMoney(total - totalPaid);

    const handlePaidInFull = (e) => {
        if (e.target.checked) {
            setNuevoAbono(Math.max(0, getValidMoney(total - historicalAdvance)));
        } else {
            setNuevoAbono('');
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
            toast.success(isUpdate ? '¡Pedido actualizado y abonado!' : '¡Pedido creado con éxito!');
            queryClient.invalidateQueries({ queryKey: ['folios'] });
            if (orderData.id) queryClient.invalidateQueries({ queryKey: ['folios', orderData.id] });
            navigate(`/folios/${result?.id || orderData.id}`);
        },
        onError: (error) => {
            // 🔥 DETECTOR DE ERRORES EXACTO DE ZOD
            const backendErrors = error.response?.data?.errors;
            const backendMessage = error.response?.data?.message;
            
            console.error("❌ RECHAZO DEL BACKEND (Detalles):", error.response?.data);
            
            if (Array.isArray(backendErrors)) {
                // Si Zod nos da una lista de campos fallidos, los mostramos todos
                const errorText = backendErrors.map(e => `${e.path || 'Campo'}: ${e.message}`).join(', ');
                toast.error(`Error de validación: ${errorText}`, { duration: 6000 });
            } else {
                toast.error(`Error: ${backendMessage || 'No se pudo procesar la solicitud'}`, { duration: 5000 });
            }
        }
    });

    const sanitizeNumber = (val) => {
        if (!val) return 0;
        const num = parseInt(val.toString().replace(/\D/g, ''), 10);
        return isNaN(num) ? 0 : num;
    };

    const handleFinish = () => {
        const pisosValidos = (orderData.pisos || []).filter(p => p.personas && sanitizeNumber(p.personas) > 0);
        const detallesPisosZod = pisosValidos.map((p, idx) => ({
            piso: idx + 1,
            personas: sanitizeNumber(p.personas),
            sabores_pan: Array.isArray(p.panes) ? p.panes : (p.panes ? [p.panes] : []),
            rellenos: Array.isArray(p.rellenos) ? p.rellenos : (p.rellenos ? [p.rellenos] : []),
            notas: p.notas || '' 
        }));

        const rawComplements = (orderData.complements || []).filter(c => c.sabor || c.relleno || (c.personas && sanitizeNumber(c.personas) > 0));
        
        const mapComplements = rawComplements.map(c => ({
            numero_personas: sanitizeNumber(c.personas),
            personas: sanitizeNumber(c.personas),
            forma: c.forma || 'Redondo',
            sabor: c.sabor || '',
            sabor_pan: c.sabor || '',
            sabores_pan: c.sabor ? [c.sabor] : [],
            relleno: c.relleno || '',
            rellenos: c.relleno ? [c.relleno] : [],
            descripcion: c.descripcion || '',
            precio: getValidMoney(c.precio)
        }));

        let hora_limpia = orderData.deliveryTime || '';
        if (hora_limpia.length > 5) hora_limpia = hora_limpia.substring(0, 5); 
        let tipoFolioSeguro = orderData.tipo_folio || 'Normal';
        if (tipoFolioSeguro === 'Base' || tipoFolioSeguro === 'Especial') tipoFolioSeguro = 'Base/Especial';

        // 🔥 LÓGICA DE ESTATUS CORRECTA PARA EL NEGOCIO
        let estatusCalculado = 'Pendiente';
        if (remaining <= 0) estatusCalculado = 'Pagado';
        else if (totalPaid > 0) estatusCalculado = 'Anticipo';

        const payload = {
            cliente_nombre: orderData.clientName,
            cliente_telefono: orderData.clientPhone,
            cliente_telefono_extra: orderData.clientPhoneExtra || '', 
            clientId: orderData.clientId || null,

            fecha_entrega: orderData.deliveryDate || undefined, // Zod odia strings vacíos en fechas
            hora_entrega: hora_limpia || undefined,
            
            tipo_folio: tipoFolioSeguro, 
            forma: orderData.shape,
            numero_personas: sanitizeNumber(orderData.peopleCount),

            sabores_pan: orderData.panes,
            rellenos: orderData.rellenos,

            detallesPisos: detallesPisosZod,
            complementarios: mapComplements,
            complementsList: mapComplements,
            
            accesorios: orderData.extras || [],
            descripcion_diseno: orderData.descripcion_diseno || '',
            dedicatoria: orderData.dedicatoria || '',
            imagen_referencia_url: orderData.imagen_referencia_url,
            
            diseno_metadata: { pisos: pisosValidos, allImages: orderData.referenceImages },

            is_delivery: !!(orderData.is_delivery || orderData.isDelivery), 
            calle: orderData.calle,
            num_ext: orderData.num_ext,
            num_int: orderData.num_int,
            colonia: orderData.colonia,
            referencias: orderData.referencias,
            ubicacion_maps: orderData.ubicacion_maps,
            
            costo_envio: shipping,
            costo_base: baseCost,
            aplica_comision: !!orderData.aplica_comision,
            totalValue: total,
            total: total,
            
            anticipo: totalPaid, 
            estatus_pago: estatusCalculado,
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
                            className="w-24 p-1 border rounded text-right font-medium focus:ring-2 focus:ring-pink-500 outline-none"
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
                        <label className="flex items-center gap-2 cursor-pointer w-max">
                            <input
                                type="checkbox"
                                checked={!!orderData.aplica_comision}
                                onChange={(e) => updateOrder({ aplica_comision: e.target.checked })}
                                className="rounded text-pink-600 focus:ring-pink-500 w-4 h-4"
                            />
                            <span className="text-sm font-bold text-blue-600 hover:text-blue-800 transition">Comisión Tarjeta (4%)</span>
                        </label>
                    </div>

                    <div className="flex justify-between text-xl font-black text-gray-800 border-t pt-3 mt-2">
                        <span>TOTAL</span>
                        <span>${total.toFixed(2)}</span>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-green-50 p-6 rounded-2xl border border-green-200">
                        
                        {historicalAdvance > 0 && (
                            <div className="flex justify-between items-center mb-4 text-green-700 bg-green-100 p-3 rounded-lg text-sm font-bold shadow-sm">
                                <span>Anticipo Histórico (Abonado):</span>
                                <span>${historicalAdvance.toFixed(2)}</span>
                            </div>
                        )}

                        <label className="block text-sm font-bold text-green-800 mb-2">Nuevo Abono (Recibido Hoy)</label>
                        <div className="relative">
                            <DollarSign className="absolute left-3 top-3.5 text-green-600" size={20} />
                            <input
                                type="number"
                                value={nuevoAbono}
                                onChange={(e) => setNuevoAbono(e.target.value)}
                                placeholder="0.00"
                                className="w-full pl-10 p-4 border border-green-300 rounded-xl text-2xl font-bold text-green-900 bg-white outline-none focus:ring-2 focus:ring-green-500"
                            />
                        </div>
                        <label className="flex items-center gap-2 mt-4 cursor-pointer w-max">
                            <input
                                type="checkbox"
                                checked={remaining <= 0 && total > 0}
                                onChange={handlePaidInFull}
                                className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
                            />
                            <span className="font-bold text-green-800 hover:text-green-900 transition">Liquidar Restante</span>
                        </label>
                    </div>

                    <div className="bg-gray-100 p-6 rounded-2xl text-center">
                        <p className="text-sm font-bold text-gray-500 uppercase">Resta por Pagar</p>
                        <p className={`text-4xl font-black ${remaining > 0 ? 'text-red-500' : 'text-green-600'}`}>
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