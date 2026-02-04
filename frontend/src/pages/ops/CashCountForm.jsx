import React from 'react';
import { useForm } from 'react-hook-form';
import { BadgeDollarSign, CreditCard, FileText, Lock, Unlock } from 'lucide-react';
import toast from 'react-hot-toast';

const CashCountForm = () => {
    const { register, handleSubmit, formState: { errors }, reset } = useForm();

    const onSubmit = (data, type) => {
        // Validación manual extra si es necesario, aunque min="0" en input ayuda
        if (parseFloat(data.cashAmount) < 0 || parseFloat(data.cardAmount) < 0) {
            toast.error("Los montos no pueden ser negativos");
            return;
        }

        console.log(`[${type}] Acción Registrada:`, data);
        console.group("📝 Log de Operación de Caja");
        console.log("Tipo:", type);
        console.log("Efectivo:", data.cashAmount);
        console.log("Tarjeta:", data.cardAmount);
        console.log("Notas:", data.notes);
        console.groupEnd();

        toast.success(`Turno ${type === 'OPEN' ? 'Abierto' : 'Cerrado'} Correctamente`);
        reset();
    };

    return (
        <div className="max-w-2xl mx-auto bg-white p-8 rounded-2xl shadow-xl border border-pink-100">
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-800 flex justify-center items-center gap-2">
                    <BadgeDollarSign className="text-pink-500" size={32} />
                    Arqueo de Caja
                </h2>
                <p className="text-gray-500 mt-2">Registra los movimientos de inicio y fin de turno</p>
            </div>

            <form className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                    {/* Efectivo */}
                    <div className="space-y-2">
                        <label className="font-bold text-gray-700 flex items-center gap-2">
                            <BadgeDollarSign size={18} className="text-green-600" /> Monto en Efectivo
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            {...register("cashAmount", { required: true, min: 0 })}
                            className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 outline-none font-mono text-lg font-bold"
                        />
                        {errors.cashAmount && <span className="text-red-500 text-sm font-bold">Campo requerido y no negativo</span>}
                    </div>

                    {/* Tarjeta */}
                    <div className="space-y-2">
                        <label className="font-bold text-gray-700 flex items-center gap-2">
                            <CreditCard size={18} className="text-blue-600" /> Monto en Tarjeta
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            {...register("cardAmount", { required: true, min: 0 })}
                            className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 outline-none font-mono text-lg font-bold"
                        />
                        {errors.cardAmount && <span className="text-red-500 text-sm font-bold">Campo requerido y no negativo</span>}
                    </div>
                </div>

                {/* Notas */}
                <div className="space-y-2">
                    <label className="font-bold text-gray-700 flex items-center gap-2">
                        <FileText size={18} className="text-gray-500" /> Notas / Observaciones
                    </label>
                    <textarea
                        {...register("notes")}
                        placeholder="Cualquier incidencia observada durante el turno..."
                        className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 outline-none h-32 resize-none"
                    ></textarea>
                </div>

                {/* Botones de Acción */}
                <div className="grid grid-cols-2 gap-4 pt-4">
                    <button
                        type="button"
                        onClick={handleSubmit((data) => onSubmit(data, 'OPEN'))}
                        className="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-6 rounded-xl transition-all hover:scale-[1.02] shadow-lg shadow-green-200"
                    >
                        <Unlock size={20} /> Abrir Turno
                    </button>

                    <button
                        type="button"
                        onClick={handleSubmit((data) => onSubmit(data, 'CLOSE'))}
                        className="flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white font-bold py-4 px-6 rounded-xl transition-all hover:scale-[1.02] shadow-lg shadow-red-200"
                    >
                        <Lock size={20} /> Cerrar Turno
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CashCountForm;
