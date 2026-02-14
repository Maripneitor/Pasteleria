import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Building, Users, AlertCircle, CheckCircle, Save, Settings as SettingsIcon, Store as StoreIcon, DollarSign, Clock, Download } from 'lucide-react';
import toast from 'react-hot-toast';

const TenantsPage = () => {
    const [tenants, setTenants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState(null);
    const [editLimit, setEditLimit] = useState(2);

    const fetchTenants = async () => {
        try {
            const res = await api.get('/super/tenants');
            setTenants(res.data);
        } catch (error) {
            console.error("Error fetching tenants", error);
            toast.error("Error al cargar dueños");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTenants();
    }, []);

    const startEdit = (tenant) => {
        setEditingId(tenant.id);
        setEditLimit(tenant.maxBranches);
    };

    const saveLimit = async (tenantId) => {
        try {
            await api.put(
                `/super/tenants/${tenantId}/limit`,
                { maxBranches: editLimit }
            );
            toast.success("Límite actualizado");
            setEditingId(null);
            fetchTenants();
        } catch (error) {
            console.error(error);
            toast.error("Error al actualizar límite");
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Cargando Dueños...</div>;

    return (
        <div className="space-y-6">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <Building className="text-pink-600" /> Gestión de Dueños (Tenants)
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">Controla los límites y acceso de cada pastelería.</p>
                </div>
                <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg text-sm font-bold">
                    Total: {tenants.length} Clientes
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tenants.map(tenant => (
                    <div key={tenant.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center text-pink-600 font-bold text-lg">
                                    {tenant.businessName.charAt(0)}
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-800">{tenant.businessName}</h3>
                                    <span className="text-xs text-gray-400">ID: {tenant.id}</span>
                                </div>
                            </div>
                            {editingId === tenant.id ? (
                                <button
                                    onClick={() => saveLimit(tenant.id)}
                                    className="p-2 bg-green-100 text-green-600 rounded-full hover:bg-green-200"
                                    title="Guardar"
                                >
                                    <Save size={18} />
                                </button>
                            ) : (
                                <button
                                    onClick={() => startEdit(tenant)}
                                    className="p-2 bg-gray-100 text-gray-500 rounded-full hover:bg-gray-200"
                                    title="Editar Límite"
                                >
                                    <SettingsIcon size={18} />
                                </button>
                            )}
                        </div>

                        <div className="space-y-3">
                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                <span className="text-sm text-gray-600 flex items-center gap-2">
                                    <StoreIcon size={16} /> Sucursales
                                </span>
                                {editingId === tenant.id ? (
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="number"
                                            value={editLimit}
                                            onChange={(e) => setEditLimit(e.target.value)}
                                            className="w-16 p-1 text-center border rounded text-sm font-bold"
                                            min="1"
                                        />
                                    </div>
                                ) : (
                                    <span className={`text-sm font-bold ${tenant.branchCount >= tenant.maxBranches ? 'text-orange-500' : 'text-green-600'}`}>
                                        {tenant.branchCount} / {tenant.maxBranches}
                                    </span>
                                )}
                            </div>

                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                <span className="text-sm text-gray-600 flex items-center gap-2">
                                    <Users size={16} /> Usuarios Admin
                                </span>
                                <span className="text-sm font-medium text-gray-800">
                                    {tenant.users && tenant.users.length > 0 ? tenant.users.length : 0}
                                </span>
                            </div>

                            <div className="pt-2 border-t border-gray-100 flex justify-between items-center text-xs text-gray-400">
                                <span>Activo desde: {new Date(tenant.lastActive || Date.now()).toLocaleDateString()}</span>
                                <div className="flex items-center gap-1 text-green-600 font-bold">
                                    <CheckCircle size={12} /> Activo
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TenantsPage;
