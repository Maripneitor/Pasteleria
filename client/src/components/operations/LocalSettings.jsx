import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Settings, Printer, MessageSquare, Save } from 'lucide-react';
import toast from 'react-hot-toast';

const LocalSettings = () => {
    const { register, handleSubmit, setValue } = useForm();

    // Cargar config al montar
    useEffect(() => {
        const printerIp = localStorage.getItem('printer_ip');
        const ticketMsg = localStorage.getItem('ticket_msg');

        if (printerIp) setValue('printer_ip', printerIp);
        if (ticketMsg) setValue('ticket_msg', ticketMsg);
    }, [setValue]);

    const onSubmit = (data) => {
        localStorage.setItem('printer_ip', data.printer_ip);
        localStorage.setItem('ticket_msg', data.ticket_msg);
        toast.success("Configuración guardada en este dispositivo");
    };

    return (
        <div className="max-w-md mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-700">
            <div className="bg-gradient-to-r from-slate-700 to-slate-900 p-6 text-white">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Settings className="w-6 h-6" /> Configuración Local
                </h2>
                <p className="opacity-70 text-sm mt-1">Ajustes específicos para esta terminal</p>
            </div>

            <form className="p-6 space-y-6" onSubmit={handleSubmit(onSubmit)}>
                {/* IP Impresora */}
                <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">IP Impresora Térmica</label>
                    <div className="relative group">
                        <Printer className="absolute left-3 top-3.5 text-gray-400 group-focus-within:text-blue-500 transition" size={20} />
                        <input
                            type="text"
                            {...register('printer_ip')}
                            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition font-mono text-sm"
                            placeholder="192.168.1.200"
                        />
                    </div>
                    <p className="text-xs text-gray-400">La dirección IP debe ser estática en la red local.</p>
                </div>

                {/* Mensaje Ticket */}
                <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Mensaje Pie de Ticket</label>
                    <div className="relative group">
                        <MessageSquare className="absolute left-3 top-3.5 text-gray-400 group-focus-within:text-blue-500 transition" size={20} />
                        <textarea
                            {...register('ticket_msg')}
                            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition resize-none h-24"
                            placeholder="¡Gracias por su preferencia!"
                        />
                    </div>
                </div>

                <div className="pt-2">
                    <button
                        type="submit"
                        className="w-full flex items-center justify-center gap-2 py-3 px-6 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 hover:bg-blue-700 active:scale-95 transition"
                    >
                        <Save className="w-5 h-5" /> Guardar Cambios
                    </button>
                </div>
            </form>
        </div>
    );
};

export default LocalSettings;
