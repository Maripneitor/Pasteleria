import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { ArrowLeft, Building, Users, Store as StoreIcon, CheckCircle, Save, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

const TenantDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [tenant, setTenant] = useState(null);
    const [loading, setLoading] = useState(true);
    
    // Edit state
    const [isEditing, setIsEditing] = useState(false);
    const [editLimit, setEditLimit] = useState(2);

    const fetchTenantData = async () => {
        try {
            const res = await api.get(`/super/tenants/${id}`);
            setTenant(res.data);
            setEditLimit(res.data.maxBranches || 2);
        } catch (error) {
            console.error("Error fetching tenant detail", error);
            toast.error("Error al cargar detalles del dueño");
            navigate('/admin/tenants');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTenantData();
    }, [id, navigate]);

    const handleSaveLimit = async () => {
        try {
            await api.put(`/super/tenants/${id}/limits`, { maxBranches: editLimit });
            toast.success("Límites actualizados");
            setIsEditing(false);
            fetchTenantData();
        } catch (error) {
            console.error(error);
            toast.error("Error al actualizar límite");
        }
    };

    if (loading) return <div className="p-10 text-center text-gray-500">Cargando detalles de dueño...</div>;
    if (!tenant) return null;

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-6">
            <button
                onClick={() => navigate('/admin/tenants')}
                className="flex items-center text-gray-500 hover:text-gray-800 transition"
            >
                <ArrowLeft size={20} className="mr-2" />
                Volver a Gestión de Dueños
            </button>

            {/* Header */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center text-pink-600 font-bold text-3xl shadow-sm">
                        {tenant.businessName?.charAt(0) || '?'}
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                            {tenant.businessName || 'Dueño sin nombre'}
                            <span className="text-sm px-3 py-1 rounded-full bg-green-100 text-green-700 font-medium flex items-center gap-1 leading-none">
                                <CheckCircle size={14} /> Activo
                            </span>
                        </h1>
                        <p className="text-gray-500 mt-1">ID Cliente: {tenant.id} &bull; Creado el {new Date(tenant.createdAt).toLocaleDateString()}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Limits & General Info Config */}
                <div className="space-y-6 md:col-span-1">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <Building size={20} className="text-purple-600" />
                            Configuración
                        </h2>
                        
                        <div className="space-y-4">
                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm font-semibold text-gray-600">Límite de Sucursales</span>
                                    {!isEditing && (
                                        <button 
                                            onClick={() => setIsEditing(true)}
                                            className="text-xs text-blue-600 hover:underline font-medium"
                                        >
                                            Editar
                                        </button>
                                    )}
                                </div>
                                {isEditing ? (
                                    <div className="flex gap-2">
                                        <input
                                            type="number"
                                            value={editLimit}
                                            onChange={(e) => setEditLimit(e.target.value)}
                                            className="w-full p-2 border rounded-lg shadow-inner bg-white font-bold"
                                            min="1"
                                        />
                                        <button 
                                            onClick={handleSaveLimit}
                                            className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 flex items-center shadow-sm"
                                        >
                                            <Save size={18} />
                                        </button>
                                    </div>
                                ) : (
                                    <p className="text-2xl font-bold text-gray-900 border-l-4 border-pink-500 pl-3">
                                        {tenant.maxBranches} <span className="text-sm font-normal text-gray-500">máximo</span>
                                    </p>
                                )}
                            </div>

                            <div className="flex justify-between items-center bg-gray-50 p-4 rounded-xl border border-gray-100">
                                <div className="flex flex-col">
                                    <span className="text-sm font-semibold text-gray-600 mb-1">Sucursales Creadas</span>
                                    <span className={`text-xl font-bold ${tenant.branches?.length >= tenant.maxBranches ? 'text-orange-600' : 'text-green-600'}`}>
                                        {tenant.branches?.length || 0} / {tenant.maxBranches}
                                    </span>
                                </div>
                                <StoreIcon size={24} className="text-gray-400" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Branches List */}
                <div className="md:col-span-2 space-y-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <StoreIcon size={20} className="text-orange-500" />
                            Sucursales ({tenant.branches?.length || 0})
                        </h2>
                        
                        {tenant.branches?.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {tenant.branches.map(branch => (
                                    <div key={branch.id} className="border border-gray-200 rounded-xl p-4 hover:border-pink-300 transition-colors bg-gradient-to-br from-white to-orange-50/30">
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="font-bold text-gray-900 truncate">{branch.name}</h3>
                                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-md font-mono">ID: {branch.id}</span>
                                        </div>
                                        <p className="text-sm text-gray-500 flex items-center gap-1 mt-2">
                                            <Calendar size={14} /> Creada: {new Date(branch.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center p-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                <StoreIcon size={32} className="mx-auto text-gray-300 mb-2" />
                                <p className="text-gray-500">Este dueño aún no tiene sucursales registradas.</p>
                            </div>
                        )}
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <Users size={20} className="text-blue-500" />
                            Usuarios Administrativos ({tenant.users?.length || 0})
                        </h2>
                        
                        {tenant.users?.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left align-middle border-collapse">
                                    <thead>
                                        <tr className="border-b border-gray-100 text-gray-500">
                                            <th className="py-2 font-semibold">Nombre</th>
                                            <th className="py-2 font-semibold">Email</th>
                                            <th className="py-2 font-semibold">Rol</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {tenant.users.map(user => (
                                            <tr key={user.id} className="border-b border-gray-50 hover:bg-gray-50">
                                                <td className="py-3 font-medium text-gray-900">{user.name}</td>
                                                <td className="py-3 text-gray-600">{user.email}</td>
                                                <td className="py-3">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-bold leading-none ${
                                                        user.role === 'OWNER' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                                                    }`}>
                                                        {user.role}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center p-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                <p className="text-gray-500">No hay usuarios asignados a este dueño.</p>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default TenantDetailPage;
