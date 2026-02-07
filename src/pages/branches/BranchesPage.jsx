import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../config/axios';
import { Plus, MapPin, Phone, Building, X } from 'lucide-react';
import toast from 'react-hot-toast';

const BranchesPage = () => {
    const { user, isOwnerOrAdmin } = useAuth();
    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        address: '',
        phone: '',
        isActive: true
    });

    const fetchBranches = async () => {
        setLoading(true);
        try {
            const res = await api.get('/branches');
            // Adapt response: sometimes it's res.data, sometimes res.data.data
            const data = Array.isArray(res.data) ? res.data : (res.data.data || []);
            setBranches(data);
        } catch (error) {
            console.error("Error fetching branches:", error);
            // If 403, might be intended for some users
            if (error.response?.status !== 403) {
                toast.error("No se pudieron cargar las sucursales");
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBranches();
    }, []);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name.trim()) return;

        setSubmitting(true);
        try {
            await api.post('/branches', formData);
            toast.success("Sucursal creada con éxito");
            setIsModalOpen(false);
            setFormData({ name: '', address: '', phone: '', isActive: true }); // Reset
            fetchBranches(); // Refresh list
        } catch (error) {
            console.error("Error creating branch:", error);
            toast.error(error.response?.data?.message || "Error al crear la sucursal");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-800 tracking-tight">Mis Sucursales</h1>
                    <p className="text-gray-500 mt-1">Gestiona los puntos de venta de tu pastelería.</p>
                </div>

                {isOwnerOrAdmin() && (
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 bg-pink-600 hover:bg-pink-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-pink-200 transition-all active:scale-95"
                    >
                        <Plus size={20} />
                        Nueva Sucursal
                    </button>
                )}
            </div>

            {/* List Content */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-40 bg-gray-100 rounded-2xl animate-pulse"></div>
                    ))}
                </div>
            ) : branches.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
                    <Building size={64} className="mx-auto text-gray-200 mb-4" />
                    <h3 className="text-xl font-bold text-gray-400">No hay sucursales registradas</h3>
                    {isOwnerOrAdmin() && <p className="text-gray-400 mt-2">Comienza creando tu primera sucursal.</p>}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {branches.map((branch) => (
                        <div key={branch.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow group">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-pink-50 text-pink-500 rounded-xl group-hover:bg-pink-100 transition-colors">
                                    <Building size={24} />
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${branch.isActive ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                    {branch.isActive ? 'ACTIVA' : 'INACTIVA'}
                                </span>
                            </div>

                            <h3 className="text-xl font-bold text-gray-800 mb-2">{branch.name}</h3>

                            <div className="space-y-2 text-sm text-gray-500">
                                {branch.address && (
                                    <div className="flex items-center gap-2">
                                        <MapPin size={16} />
                                        <span className="truncate">{branch.address}</span>
                                    </div>
                                )}
                                {branch.phone && (
                                    <div className="flex items-center gap-2">
                                        <Phone size={16} />
                                        <span>{branch.phone}</span>
                                    </div>
                                )}
                                <div className="text-xs text-gray-400 mt-4 pt-4 border-t border-gray-50">
                                    ID: <span className="font-mono">{branch.id}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal Create */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="text-xl font-bold text-gray-800">Nueva Sucursal</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-200 rounded-full transition">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Nombre de la Sucursal <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="Ej. Sucursal Centro"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-pink-500 focus:ring-2 focus:ring-pink-200 outline-none transition-all"
                                    required
                                    autoFocus
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Dirección</label>
                                <input
                                    type="text"
                                    name="address"
                                    value={formData.address}
                                    onChange={handleChange}
                                    placeholder="Calle Principal #123"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-pink-500 focus:ring-2 focus:ring-pink-200 outline-none transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Teléfono</label>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    placeholder="(555) 123-4567"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-pink-500 focus:ring-2 focus:ring-pink-200 outline-none transition-all"
                                />
                            </div>

                            <div className="flex items-center gap-3 pt-2">
                                <input
                                    type="checkbox"
                                    id="isActive"
                                    name="isActive"
                                    checked={formData.isActive}
                                    onChange={handleChange}
                                    className="w-5 h-5 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
                                />
                                <label htmlFor="isActive" className="text-sm font-medium text-gray-700 select-none cursor-pointer">
                                    Sucursal Activa para Operaciones
                                </label>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 px-4 py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-black transition-colors disabled:opacity-70 flex justify-center items-center"
                                >
                                    {submitting ? 'Guardando...' : 'Crear Sucursal'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BranchesPage;
