import React from 'react';
import { useForm } from 'react-hook-form';
import { BadgeDollarSign, Tag, FileText, Send } from 'lucide-react';

const ExpenseForm = () => {
    const { register, handleSubmit, reset } = useForm();

    const onSubmit = (data) => {
        alert("💸 Gasto registrado correctamente");
        console.log("Gasto:", data);
        reset();
    };

    return (
        <div className="max-w-md mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-700">
            <div className="bg-gradient-to-r from-orange-500 to-red-500 p-6 text-white">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                    <BadgeDollarSign className="w-6 h-6" /> Registrar Gasto
                </h2>
                <p className="opacity-90 text-sm mt-1">Salidas de efectivo menores</p>
            </div>

            <form className="p-6 space-y-5" onSubmit={handleSubmit(onSubmit)}>
                {/* Concepto */}
                <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Concepto</label>
                    <div className="relative">
                        <FileText className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            {...register('concept', { required: true })}
                            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
                            placeholder="Ej. Compra de limones"
                        />
                    </div>
                </div>

                {/* Monto */}
                <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Monto ($)</label>
                    <div className="relative">
                        <span className="absolute left-3 top-3 text-gray-400 text-lg font-bold">$</span>
                        <input
                            type="number"
                            step="0.01"
                            {...register('amount', { required: true })}
                            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
                            placeholder="0.00"
                        />
                    </div>
                </div>

                {/* Categoría */}
                <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Categoría</label>
                    <div className="relative">
                        <Tag className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                        <select
                            {...register('category', { required: true })}
                            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition appearance-none cursor-pointer"
                        >
                            <option value="insumos">Insumos (Materia Prima)</option>
                            <option value="servicios">Servicios (Luz, Agua, etc)</option>
                            <option value="mantenimiento">Mantenimiento</option>
                            <option value="otros">Otros</option>
                        </select>
                    </div>
                </div>

                <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-2 py-4 bg-gray-900 text-white rounded-xl hover:bg-black transition shadow-lg shadow-gray-400/20 active:scale-95 transform"
                >
                    <Send className="w-5 h-5" /> Registrar Gasto
                </button>
            </form>
        </div>
    );
};

export default ExpenseForm;
