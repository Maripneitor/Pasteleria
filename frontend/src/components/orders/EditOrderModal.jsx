import React, { useState } from 'react';
import { X, Save, Calendar, Clock, MapPin, FileText, User, PenTool } from 'lucide-react';
import client from '@/config/axios';
import toast from 'react-hot-toast';

const EditOrderModal = ({ order, isOpen, onClose, onUpdate }) => {
    const [formData, setFormData] = useState({
        cliente_nombre: order.cliente_nombre || order.clientName || '',
        descripcion_diseno: order.descripcion_diseno || order.description || '',
        fecha_entrega: order.fecha_entrega || order.deliveryDate || '',
        hora_entrega: order.hora_entrega || order.deliveryTime || '',
        deliveryLocation: order.deliveryLocation || ''
    });
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await client.put(`/folios/${order.id}`, formData);
            toast.success('Pedido actualizado');
            onUpdate();
            onClose();
        } catch (error) {
            console.error(error);
            toast.error('Error al actualizar');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="font-bold text-lg text-gray-800">Editar Pedido #{order.folioNumber || order.id}</h3>
                    <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full transition">
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Nombre Cliente</label>
                        <div className="relative">
                            <User size={18} className="absolute left-3 top-3 text-pink-500" />
                            <input
                                type="text"
                                name="cliente_nombre"
                                value={formData.cliente_nombre}
                                onChange={handleChange}
                                className="w-full pl-10 p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-pink-500 outline-none transition"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Fecha Entrega</label>
                            <div className="relative">
                                <Calendar size={18} className="absolute left-3 top-3 text-pink-500" />
                                <input
                                    type="date"
                                    name="fecha_entrega"
                                    value={formData.fecha_entrega}
                                    onChange={handleChange}
                                    className="w-full pl-10 p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-pink-500 outline-none transition"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Hora Entrega</label>
                            <div className="relative">
                                <Clock size={18} className="absolute left-3 top-3 text-pink-500" />
                                <input
                                    type="time"
                                    name="hora_entrega"
                                    value={formData.hora_entrega}
                                    onChange={handleChange}
                                    className="w-full pl-10 p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-pink-500 outline-none transition"
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Ubicación Entrega</label>
                        <div className="relative">
                            <MapPin size={18} className="absolute left-3 top-3 text-pink-500" />
                            <input
                                type="text"
                                name="deliveryLocation"
                                value={formData.deliveryLocation}
                                onChange={handleChange}
                                className="w-full pl-10 p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-pink-500 outline-none transition"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Descripción / Notas</label>
                        <div className="relative">
                            <PenTool size={18} className="absolute left-3 top-3 text-pink-500" />
                            <textarea
                                name="descripcion_diseno"
                                value={formData.descripcion_diseno}
                                onChange={handleChange}
                                rows={3}
                                className="w-full pl-10 p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-pink-500 outline-none transition"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-3 text-gray-600 font-bold hover:bg-gray-100 rounded-xl transition"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-pink-200 transition flex items-center gap-2 transform hover:-translate-y-0.5"
                        >
                            {loading ? 'Guardando...' : <><Save size={18} /> Guardar Cambios</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditOrderModal;
