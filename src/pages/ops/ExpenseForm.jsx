import React from 'react';
import { useForm } from 'react-hook-form';
import { Wallet, Tag, DollarSign, Send } from 'lucide-react';
import toast from 'react-hot-toast';

const ExpenseForm = () => {
    const { register, handleSubmit, reset, formState: { errors } } = useForm();

    const onSubmit = (data) => {
        console.log("💸 Retiro Registrado:", data);
        toast.success(`Retiro de $${data.amount} registrado para ${data.category}`);
        reset();
    };

    return (
        <div className="max-w-xl mx-auto bg-white p-8 rounded-2xl shadow-xl border border-pink-100">
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-800 flex justify-center items-center gap-2">
                    <Wallet className="text-pink-500" size={32} />
                    Registro de Gastos
                </h2>
                <p className="text-gray-500 mt-2">Registra salidas de dinero de la caja chica</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div>
                    <label className="font-bold text-gray-700 flex items-center gap-2 mb-2">
                        <Tag size={18} className="text-gray-500" /> Concepto
                    </label>
                    <input
                        type="text"
                        placeholder="Ej: Pago de garrafones"
                        {...register("concept", { required: "El concepto es obligatorio" })}
                        className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 outline-none"
                    />
                    {errors.concept && <span className="text-xs text-red-500 font-bold block mt-1">{errors.concept.message}</span>}
                </div>

                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <label className="font-bold text-gray-700 flex items-center gap-2 mb-2">
                            <DollarSign size={18} className="text-green-600" /> Monto
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            {...register("amount", { required: "El monto es obligatorio", min: 0.01 })}
                            className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 outline-none font-mono font-bold"
                        />
                        {errors.amount && <span className="text-xs text-red-500 font-bold block mt-1">{errors.amount.message}</span>}
                    </div>

                    <div>
                        <label className="font-bold text-gray-700 flex items-center gap-2 mb-2">
                            <Tag size={18} className="text-blue-500" /> Categoría
                        </label>
                        <select
                            {...register("category")}
                            className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 outline-none appearance-none cursor-pointer"
                        >
                            <option value="Insumos">🛒 Insumos</option>
                            <option value="Servicios">💡 Servicios</option>
                            <option value="Transporte">🚕 Transporte</option>
                            <option value="Otros">📦 Otros</option>
                        </select>
                    </div>
                </div>

                <button
                    type="submit"
                    className="w-full bg-pink-500 hover:bg-pink-600 text-white font-bold py-4 px-6 rounded-xl transition-all hover:scale-[1.02] shadow-lg shadow-pink-200 flex items-center justify-center gap-2 mt-4"
                >
                    <Send size={20} /> Registrar Retiro
                </button>
            </form>
        </div>
    );
};

export default ExpenseForm;
