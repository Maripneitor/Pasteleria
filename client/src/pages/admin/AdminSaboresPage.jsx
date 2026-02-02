import React, { useState, useEffect } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import { Plus, Edit2, Trash2, CheckCircle, XCircle, Cake, Droplet, Search } from 'lucide-react';
import catalogApi from '../../services/catalogApi';
import toast from 'react-hot-toast';

export default function AdminSaboresPage() {
    const [activeTab, setActiveTab] = useState('flavors'); // flavors | fillings
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);

    // Form State
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState(null);
    const [formData, setFormData] = useState({ name: '', isActive: true });

    // Load data
    const fetchData = React.useCallback(async () => {
        setLoading(true);
        try {
            const data = activeTab === 'flavors'
                ? await catalogApi.getFlavors(true)
                : await catalogApi.getFillings(true);
            setItems(data);
        } catch {
            toast.error('Error al cargar catálogo');
        } finally {
            setLoading(false);
        }
    }, [activeTab]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Handlers
    const handleOpenCreate = () => {
        setFormData({ name: '', isActive: true });
        setIsEditing(false);
        setShowModal(true);
    };

    const handleEdit = (item) => {
        setFormData({ name: item.name, isActive: item.isActive });
        setEditId(item.id);
        setIsEditing(true);
        setShowModal(true);
    };

    const handleToggle = async (item) => {
        try {
            const newVal = !item.isActive;
            if (activeTab === 'flavors') {
                await catalogApi.toggleFlavor(item.id, newVal);
            } else {
                await catalogApi.toggleFilling(item.id, newVal);
            }
            toast.success('Estado actualizado');
            fetchData();
        } catch {
            toast.error('No se pudo actualizar');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (isEditing) {
                if (activeTab === 'flavors') await catalogApi.updateFlavor(editId, formData);
                else await catalogApi.updateFilling(editId, formData);
                toast.success('Actualizado correctamente');
            } else {
                if (activeTab === 'flavors') await catalogApi.createFlavor(formData);
                else await catalogApi.createFilling(formData);
                toast.success('Creado correctamente');
            }
            setShowModal(false);
            fetchData();
        } catch {
            toast.error('Error al guardar');
        }
    };

    return (
        <div className="p-6 max-w-5xl mx-auto fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                        {activeTab === 'flavors' ? <Cake className="text-pink-500" /> : <Droplet className="text-blue-500" />}
                        Catálogo de {activeTab === 'flavors' ? 'Sabores' : 'Rellenos'}
                    </h1>
                    <p className="text-gray-500 mt-1">
                        Gestiona las opciones disponibles para los pedidos.
                    </p>
                </div>
                <button
                    onClick={handleOpenCreate}
                    className="bg-gray-900 text-white px-5 py-3 rounded-xl font-bold shadow-lg hover:bg-black transition flex items-center gap-2"
                >
                    <Plus size={20} /> Nuevo {activeTab === 'flavors' ? 'Sabor' : 'Relleno'}
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 mb-6 border-b border-gray-200">
                <button
                    onClick={() => setActiveTab('flavors')}
                    className={`pb-4 px-4 font-bold text-lg transition border-b-2 
                    ${activeTab === 'flavors' ? 'border-pink-500 text-pink-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                >
                    🍰 Sabores de Pan
                </button>
                <button
                    onClick={() => setActiveTab('fillings')}
                    className={`pb-4 px-4 font-bold text-lg transition border-b-2 
                    ${activeTab === 'fillings' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                >
                    🍯 Rellenos
                </button>
            </div>

            {/* Content */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center text-gray-400">
                        <div className="animate-spin text-4xl mb-2">↻</div>
                        Cargando catálogo...
                    </div>
                ) : items.length === 0 ? (
                    <div className="p-12 text-center text-gray-400">
                        No hay registros. Crea el primero.
                    </div>
                ) : (
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="p-5 text-sm font-bold text-gray-500 uppercase">Nombre</th>
                                <th className="p-5 text-sm font-bold text-gray-500 uppercase">Estado</th>
                                <th className="p-5 text-sm font-bold text-gray-500 uppercase text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {items.map(item => (
                                <tr key={item.id} className="hover:bg-gray-50/50 transition">
                                    <td className="p-5 font-bold text-gray-700">{item.name}</td>
                                    <td className="p-5">
                                        <button
                                            onClick={() => handleToggle(item)}
                                            className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold transition
                                            ${item.isActive ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                                        >
                                            {item.isActive ? <CheckCircle size={14} /> : <XCircle size={14} />}
                                            {item.isActive ? 'Activo' : 'Inactivo'}
                                        </button>
                                    </td>
                                    <td className="p-5 text-right">
                                        <button
                                            onClick={() => handleEdit(item)}
                                            className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition"
                                        >
                                            <Edit2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md"
                    >
                        <h2 className="text-2xl font-bold mb-6 text-gray-800">
                            {isEditing ? 'Editar' : 'Nuevo'} {activeTab === 'flavors' ? 'Sabor' : 'Relleno'}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Nombre</label>
                                <input
                                    autoFocus
                                    required
                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 outline-none transition"
                                    placeholder={`Ej. ${activeTab === 'flavors' ? 'Chocolate' : 'Fresa'}`}
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>

                            <div className="flex items-center gap-3 py-2">
                                <label className="text-sm font-bold text-gray-700">Disponible:</label>
                                <button
                                    type="button"
                                    onClick={() => setFormData(p => ({ ...p, isActive: !p.isActive }))}
                                    className={`w-12 h-7 rounded-full p-1 transition-colors duration-300 relative ${formData.isActive ? 'bg-green-500' : 'bg-gray-300'}`}
                                >
                                    <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-300 ${formData.isActive ? 'translate-x-5' : 'translate-x-0'}`} />
                                </button>
                            </div>

                            <div className="flex gap-3 mt-8">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-black transition shadow-lg"
                                >
                                    Guardar
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
