import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { Save, Users, Cake, Image as ImageIcon, Mic } from 'lucide-react';
import client from '../config/axios';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import VoiceModal from '../components/VoiceModal';

// Componente de Sección Colapsable (Reutilizado)
const Section = ({ title, isOpen, toggle, children, icon: Icon }) => (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm mb-4 overflow-hidden border border-gray-100 dark:border-gray-700">
        <button type="button" onClick={toggle} className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 transition">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-pink-100 text-pink-600 rounded-lg">{Icon && <Icon size={20} />}</div>
                <h3 className="font-bold text-lg text-gray-700 dark:text-white">{title}</h3>
            </div>
            <span className={`transform transition ${isOpen ? 'rotate-180' : ''}`}>▼</span>
        </button>
        <AnimatePresence>
            {isOpen && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="p-6">
                    {children}
                </motion.div>
            )}
        </AnimatePresence>
    </div>
);

const NewOrderPage = () => {
    const navigate = useNavigate();
    const [sections, setSections] = useState({ cliente: true, detalles: true, diseno: false, entrega: false });
    const [isVoiceOpen, setIsVoiceOpen] = useState(false);
    const toggle = (sec) => setSections(prev => ({ ...prev, [sec]: !prev[sec] }));

    // --- CONFIGURACIÓN DE REACT HOOK FORM ---
    const { register, control, handleSubmit, watch, setValue, formState: { errors } } = useForm({
        defaultValues: {
            cliente_nombre: '',
            sabores_pan: ['Vainilla'], // Valor por defecto
            tipo_folio: 'Normal',
            hora_entrega_h: '14',
            hora_entrega_m: '00',
            hora_entrega_ampm: 'PM',
            costo_base: 0,
            costo_envio: 0,
            anticipo: 0
        }
    });

    const location = useLocation();

    // 🧠 EFECTO: Cargar datos desde la URL (IA / WhatsApp)
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const dataString = params.get('data');

        if (dataString) {
            try {
                const data = JSON.parse(decodeURIComponent(dataString));
                console.log("🤖 Datos recibidos de IA:", data);

                // MAPEO: Inglés (IA) -> Español (Formulario)
                if (data.clientName) setValue('cliente_nombre', data.clientName);
                if (data.clientPhone) setValue('cliente_telefono', data.clientPhone);

                // Manejo de fecha y hora
                if (data.deliveryDate) setValue('fecha_entrega', data.deliveryDate);
                if (data.deliveryTime) {
                    const [hora, min] = data.deliveryTime.split(':');
                    const horaInt = parseInt(hora);
                    setValue('hora_entrega_h', horaInt > 12 ? horaInt - 12 : (horaInt === 0 ? 12 : horaInt));
                    setValue('hora_entrega_m', min);
                    setValue('hora_entrega_ampm', horaInt >= 12 ? 'PM' : 'AM');
                }

                // Listas y Enums
                if (data.folioType) setValue('tipo_folio', (data.folioType === 'Special' || data.folioType === 'Base/Especial') ? 'Especial' : 'Normal');
                if (data.cakeFlavor) setValue('sabores_pan', Array.isArray(data.cakeFlavor) ? data.cakeFlavor : [data.cakeFlavor]);
                if (data.filling) setValue('rellenos', Array.isArray(data.filling) ? data.filling : [data.filling]);
                if (data.designDescription) setValue('descripcion_diseno', data.designDescription);
                if (data.persons) toast.success(`Pedido sugerido para ${data.persons} personas`, { icon: '👥' });

                toast.success(<b>¡Datos precargados por la IA! 🤖</b>);
            } catch (error) {
                console.error("Error parseando datos URL:", error);
                toast.error("No se pudieron cargar los datos del enlace.");
            }
        }
    }, [location, setValue]);

    // Watchers para cálculos en tiempo real
    const costoBase = watch('costo_base');
    const costoEnvio = watch('costo_envio');
    const anticipo = watch('anticipo');
    const totalCalculado = (parseFloat(costoBase) || 0) + (parseFloat(costoEnvio) || 0);
    const restaCalculada = totalCalculado - (parseFloat(anticipo) || 0);

    // Envío de Datos al Backend
    const onSubmit = async (data) => {
        try {
            // Formatear hora final
            const horaFinal = `${data.hora_entrega_h}:${data.hora_entrega_m} ${data.hora_entrega_ampm}`;

            const payload = {
                ...data,
                hora_entrega: horaFinal,
                total: totalCalculado,
                // Aquí podrías agregar lógica para subir la imagen primero si existe
            };

            // Llamada Axios (Asegúrate de tener configurada la baseURL en tu instancia de axios)
            // Si no tienes instancia configurada, usa la URL completa temporalmente
            // const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
            // Nota: Asegúrate de tener el token de autenticación si es necesario
            await toast.promise(
                client.post('/folios', payload),
                {
                    loading: 'Guardando pastel delicioso...',
                    success: <b>¡Folio Creado Exitosamente! 🍰</b>,
                    error: <b>Ups, algo falló. Intenta de nuevo.</b>,
                }
            );

            navigate('/');
        } catch (error) {
            console.error(error);
            // El toast ya maneja el error visualmente
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="max-w-4xl mx-auto p-4 pb-32">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold flex gap-2 items-center">
                    <span className="text-pink-500 text-3xl">+</span> Crear Nuevo Folio
                </h1>
                <button
                    type="button"
                    className="bg-violet-600 text-white px-4 py-2 rounded-full flex items-center gap-2 shadow-lg hover:bg-violet-700"
                    onClick={() => setIsVoiceOpen(true)}
                >
                    <Mic size={18} className="animate-pulse" /> Dictar (IA)
                </button>
            </div>

            <VoiceModal
                isOpen={isVoiceOpen}
                onClose={() => setIsVoiceOpen(false)}
                isListening={true}
            />

            {/* 1. Datos del Cliente */}
            <Section title="Datos del Cliente" isOpen={sections.cliente} toggle={() => toggle('cliente')} icon={Users}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input {...register('cliente_nombre', { required: true })} placeholder="Nombre Completo" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 outline-none" />
                    <input {...register('cliente_telefono', { required: true })} placeholder="Teléfono Principal" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 outline-none" type="tel" />
                </div>
            </Section>

            {/* 2. Detalles del Pedido */}
            <Section title="Detalles del Pedido" isOpen={sections.detalles} toggle={() => toggle('detalles')} icon={Cake}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Fecha de Entrega</label>
                        <input {...register('fecha_entrega', { required: true })} type="date" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none" />
                    </div>

                    {/* Selector de Hora (Ruleta Manual) */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Hora de Entrega</label>
                        <div className="flex gap-2 p-2 bg-gray-50 rounded-lg border justify-center">
                            <select {...register('hora_entrega_h')} className="bg-transparent text-xl font-bold outline-none cursor-pointer appearance-none">
                                {Array.from({ length: 12 }, (_, i) => i + 1).map(h => <option key={h} value={h}>{h < 10 ? `0${h}` : h}</option>)}
                            </select>
                            <span className="text-xl font-bold">:</span>
                            <select {...register('hora_entrega_m')} className="bg-transparent text-xl font-bold outline-none cursor-pointer appearance-none">
                                {['00', '15', '30', '45'].map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                            <select {...register('hora_entrega_ampm')} className="ml-2 text-sm font-bold bg-pink-100 text-pink-600 rounded px-2 outline-none">
                                <option value="AM">AM</option>
                                <option value="PM">PM</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Tipo de Pastel (Visual Radio Buttons) */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                    <label className="cursor-pointer">
                        <input type="radio" value="Normal" {...register('tipo_folio')} className="hidden peer" />
                        <div className="p-4 border rounded-xl hover:border-pink-500 peer-checked:border-pink-500 peer-checked:bg-pink-50 transition active:scale-95 transition-transform">
                            <span className="font-bold block text-pink-600">Pastel Normal</span>
                            <span className="text-xs text-gray-500">Un solo piso / Tradicional</span>
                        </div>
                    </label>
                    <label className="cursor-pointer">
                        <input type="radio" value="Especial" {...register('tipo_folio')} className="hidden peer" />
                        <div className="p-4 border rounded-xl hover:border-pink-500 peer-checked:border-pink-500 peer-checked:bg-pink-50 transition active:scale-95 transition-transform">
                            <span className="font-bold block text-gray-600">Base / Especial</span>
                            <span className="text-xs text-gray-500">Pisos múltiples</span>
                        </div>
                    </label>
                </div>
            </Section>

            {/* 3. Diseño e IA */}
            <Section title="Diseño y Visuales" isOpen={sections.diseno} toggle={() => toggle('diseno')} icon={ImageIcon}>
                <textarea
                    {...register('descripcion_diseno')}
                    placeholder="Descripción detallada del diseño..."
                    className="w-full h-24 p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 outline-none"
                ></textarea>
            </Section>

            {/* 4. Pagos y Finanzas */}
            <Section title="Cuentas Claras" isOpen={true} toggle={() => { }} icon={Save}>
                <div className="grid grid-cols-3 gap-4">
                    <div>
                        <label className="text-xs font-bold text-gray-500">Costo Base</label>
                        <div className="relative">
                            <span className="absolute left-3 top-2 text-gray-400">$</span>
                            <input type="number" {...register('costo_base')} className="w-full pl-6 p-2 bg-gray-50 rounded border font-mono font-bold" />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-500">Envío</label>
                        <div className="relative">
                            <span className="absolute left-3 top-2 text-gray-400">$</span>
                            <input type="number" {...register('costo_envio')} className="w-full pl-6 p-2 bg-gray-50 rounded border font-mono font-bold" />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-500">Anticipo</label>
                        <div className="relative">
                            <span className="absolute left-3 top-2 text-gray-400">$</span>
                            <input type="number" {...register('anticipo')} className="w-full pl-6 p-2 bg-gray-50 rounded border font-mono font-bold text-green-600" />
                        </div>
                    </div>
                </div>
            </Section>

            {/* Footer Flotante */}
            <div className="fixed bottom-0 left-0 right-0 glass-effect border-t p-4 flex flex-col md:flex-row justify-between items-center z-50 md:pl-64 gap-4 transition-all">
                <div className="w-full md:w-auto text-center md:text-left">
                    <span className="text-gray-500 text-xs block uppercase tracking-wider">Total Estimado</span>
                    <div className="flex gap-2 items-baseline justify-center md:justify-start">
                        <span className="text-xl font-bold text-gray-800">${totalCalculado.toFixed(2)}</span>
                        <span className="text-sm font-bold text-red-500">(Resta: ${restaCalculada.toFixed(2)})</span>
                    </div>
                </div>
                <div className="w-full md:w-auto flex gap-3">
                    <button type="button" onClick={() => navigate('/')} className="flex-1 md:flex-none py-3 px-6 rounded-xl bg-gray-200 text-gray-700 font-bold active:scale-95 transition">
                        Cancelar
                    </button>
                    <button type="submit" className="flex-1 md:flex-none py-3 px-6 rounded-xl bg-gradient-to-r from-pink-500 to-pink-600 text-white font-bold shadow-lg shadow-pink-500/30 active:scale-95 transition flex justify-center items-center gap-2">
                        <Save size={18} /> Guardar
                    </button>
                </div>
            </div>
        </form>
    );
};

export default NewOrderPage;
