import React from 'react';
import { useForm } from 'react-hook-form';
import { DollarSign, CreditCard, FileText, Lock, Unlock } from 'lucide-react';

const CashCountForm = () => {
    const { register, handleSubmit } = useForm();

    const onSubmit = (data, event) => {
        // Fallback or explicit check if we want to be super safe, but using the click handler approach below is better
        // However, let's keep it simple and robust:
        // We will add a hidden input or state, but since we are KISS, let's just inspect the submitter carefully
        // or rely on the state set by the button click.
        // Actually, the previous code used event.nativeEvent.submitter.name.
        // Let's improve robustness by setting a value on click.

        // BETTER APPROACH: Use a ref or state to track which button was clicked, or just simpler:
        // The event.nativeEvent.submitter is usually fine in modern browsers but can be null in some test envs.
        // Let's trust the button `name` attribute for now, but ensure we handle `?` case.
        const actionType = event.nativeEvent.submitter?.name || 'unknown';

        const payload = {
            ...data,
            timestamp: new Date().toISOString(),
            type: actionType
        };
        console.log("💰 Arqueo de Caja:", payload);
        // reset(); // Optional: clear form after submit
    };

    return (
        <div className="max-w-md mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-700">
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-6 text-white">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                    <DollarSign className="w-6 h-6" /> Arqueo de Caja
                </h2>
                <p className="opacity-90 text-sm mt-1">Control de inicio y fin de turno</p>
            </div>

            <form className="p-6 space-y-4" onSubmit={handleSubmit(onSubmit)}>
                {/* Efectivo */}
                <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Efectivo en Caja ($)</label>
                    <div className="relative">
                        <DollarSign className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                        <input
                            type="number"
                            step="0.01"
                            {...register('cash', { required: true })}
                            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition"
                            placeholder="0.00"
                        />
                    </div>
                </div>

                {/* Tarjeta */}
                <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Ventas con Tarjeta ($)</label>
                    <div className="relative">
                        <CreditCard className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                        <input
                            type="number"
                            step="0.01"
                            {...register('card', { required: true })}
                            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition"
                            placeholder="0.00"
                        />
                    </div>
                </div>

                {/* Notas */}
                <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Observaciones</label>
                    <div className="relative">
                        <FileText className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                        <textarea
                            {...register('notes')}
                            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition resize-none h-24"
                            placeholder="Diferencias, cambios, etc..."
                        />
                    </div>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-4 pt-4">
                    <button
                        type="submit"
                        name="open"
                        className="flex items-center justify-center gap-2 py-3 px-4 bg-emerald-100 text-emerald-700 rounded-xl hover:bg-emerald-200 transition font-bold"
                    >
                        <Unlock className="w-4 h-4" /> Abrir Turno
                    </button>
                    <button
                        type="submit"
                        name="close"
                        className="flex items-center justify-center gap-2 py-3 px-4 bg-red-100 text-red-700 rounded-xl hover:bg-red-200 transition font-bold"
                    >
                        <Lock className="w-4 h-4" /> Cerrar Turno
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CashCountForm;
