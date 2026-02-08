import React, { useState } from 'react';
import { X, Save, User } from 'lucide-react';
import toast from 'react-hot-toast';
import clientsApi from '../../services/clients';

export default function CreateClientModal({ isOpen, onClose, onClientCreated }) {
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        phone2: '', // Optional
        email: ''   // Optional
    });
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const newClient = await clientsApi.createClient(formData);
            toast.success('Cliente creado exitosamente');
            onClientCreated(newClient);
            onClose();
            setFormData({ name: '', phone: '', phone2: '', email: '' });
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Error creando cliente');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md animate-in fade-in zoom-in duration-200">
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <User className="text-pink-600" />
                        Nuevo Cliente
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo *</label>
                        <input
                            type="text"
                            required
                            className="w-full rounded-xl border-gray-200 focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 transition-all"
                            placeholder="Ej. Juan Pérez"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono (WhatsApp) *</label>
                        <input
                            type="tel"
                            required
                            className="w-full rounded-xl border-gray-200 focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 transition-all"
                            placeholder="Ej. 55 1234 5678"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Teléfono 2 (Opcional)</label>
                            <input
                                type="tel"
                                className="w-full rounded-xl border-gray-200 focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 transition-all text-sm"
                                placeholder="Casa / Oficina"
                                value={formData.phone2}
                                onChange={(e) => setFormData({ ...formData, phone2: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Email (Opcional)</label>
                            <input
                                type="email"
                                className="w-full rounded-xl border-gray-200 focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 transition-all text-sm"
                                placeholder="usuario@email.com"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 text-gray-600 font-medium hover:bg-gray-50 rounded-xl transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 py-3 bg-pink-600 hover:bg-pink-700 text-white font-bold rounded-xl shadow-lg shadow-pink-500/30 transition-all hover:scale-105 active:scale-95 disabled:opacity-70 disabled:pointer-events-none flex items-center justify-center gap-2"
                        >
                            {loading ? 'Guardando...' : <><Save size={18} /> Guardar Cliente</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
