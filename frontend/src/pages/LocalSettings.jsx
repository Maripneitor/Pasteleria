import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Printer, Save } from 'lucide-react';
import toast from 'react-hot-toast';

const LocalSettings = () => {
    const { register, handleSubmit, setValue } = useForm();

    useEffect(() => {
        // Cargar config guardada
        const savedConfig = localStorage.getItem('lafiesta_config');
        if (savedConfig) {
            const parsed = JSON.parse(savedConfig);
            setValue('printerIp', parsed.printerIp);
            setValue('printerName', parsed.printerName);
            setValue('ticketMessage', parsed.ticketMessage);
        }
    }, [setValue]);

    const onSubmit = (data) => {
        localStorage.setItem('lafiesta_config', JSON.stringify(data));
        toast.success('Configuración guardada localmente');
    };

    return (
        <div className="max-w-2xl mx-auto p-6">
            <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Printer className="text-gray-500" /> Configuración Local
            </h1>

            <div className="bg-white p-6 rounded-2xl shadow-sm border">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">IP de Impresora Térmica</label>
                        <input {...register('printerIp')} placeholder="Ej: 192.168.1.200" className="w-full p-3 border rounded-xl" />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Nombre de Impresora (Sistema)</label>
                        <input {...register('printerName')} placeholder="Ej: EPSON_TM_T20" className="w-full p-3 border rounded-xl" />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Mensaje al Pie del Ticket</label>
                        <textarea {...register('ticketMessage')} placeholder="¡Gracias por su compra!" className="w-full p-3 border rounded-xl h-24" />
                    </div>

                    <button type="submit" className="w-full py-3 bg-gray-900 text-white rounded-xl font-bold flex items-center justify-center gap-2">
                        <Save size={18} /> Guardar Configuración
                    </button>
                </form>
            </div>
        </div>
    );
};

export default LocalSettings;
