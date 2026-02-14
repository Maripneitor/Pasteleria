import React, { useEffect, useState } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import { Plus, Trash2, Edit2, Shield, ShieldOff, CheckCircle, XCircle } from 'lucide-react';
import usersApi from '../services/usersApi';
import branchesApi from '../services/branchesApi';
import toast from 'react-hot-toast';

const TeamPage = () => {
    const [users, setUsers] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        username: '',
        name: '',
        email: '',
        password: '',
        role: 'EMPLOYEE',
        branchId: ''
    });
    const [branches, setBranches] = useState([]);
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState(null);

    const fetchUsers = async () => {
        try {
            const data = await usersApi.getAll();
            setUsers(data);
        } catch {
            toast.error('Error cargando usuarios');
        }
    };

    const fetchBranches = async () => {
        try {
            const data = await branchesApi.getAll();
            setBranches(data);
        } catch (error) {
            console.error("Error fetching branches:", error);
        }
    };

    useEffect(() => {
        let mounted = true;
        const load = async () => {
            if (mounted) {
                await fetchUsers();
                await fetchBranches();
            }
        };
        load();
        return () => { mounted = false; };
    }, []);

    const handleDelete = async (id) => {
        if (!window.confirm('¿Seguro que deseas eliminar este usuario permanentemente?')) return;
        try {
            await usersApi.delete(id);
            toast.success('Usuario eliminado');
            fetchUsers();
        } catch (error) {
            console.error(error);
            toast.error('No se pudo eliminar');
        }
    };

    const handleToggleStatus = async (user) => {
        try {
            await usersApi.toggleStatus(user.id, !user.isActive);
            toast.success(user.isActive ? 'Usuario desactivado' : 'Usuario activado');
            fetchUsers();
        } catch (error) {
            console.error(error);
            toast.error('Error cambiando estado');
        }
    };

    const handleEdit = (user) => {
        setFormData({
            username: user.username || user.name,
            name: user.name || user.username,
            email: user.email,
            password: '',
            role: user.role || 'EMPLOYEE',
            branchId: user.branchId || ''
        });
        setEditId(user.id);
        setIsEditing(true);
        setShowModal(true);
    };

    const handleOpenCreate = () => {
        setFormData({
            username: '',
            name: '',
            email: '',
            password: '',
            role: 'EMPLOYEE',
            branchId: ''
        });
        setIsEditing(false);
        setEditId(null);
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (isEditing) {
                // Only send password if provided
                const dataToSend = { ...formData, name: formData.username }; // Controller maps name to username
                if (!dataToSend.password) delete dataToSend.password;

                await usersApi.update(editId, dataToSend);
                toast.success('Usuario actualizado');
            } else {
                await usersApi.create(formData);
                toast.success('Usuario creado');
            }
            setShowModal(false);
            fetchUsers();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Error en la operación');
        }
    };

    const RoleBadge = ({ role }) => {
        const styles = {
            SUPER_ADMIN: 'bg-red-100 text-red-700 border-red-200',
            ADMIN: 'bg-purple-100 text-purple-700 border-purple-200',
            OWNER: 'bg-pink-100 text-pink-700 border-pink-200',
            EMPLOYEE: 'bg-indigo-100 text-indigo-700 border-indigo-200',
            USER: 'bg-gray-100 text-gray-600 border-gray-200'
        };
        const r = role || 'USER';
        return (
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${styles[r] || styles.USER}`}>
                {r.replace('_', ' ')}
            </span>
        );
    };

    return (
        <div className="p-6 max-w-7xl mx-auto fade-in">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Equipo de Trabajo</h1>
                    <p className="text-gray-500">Gestiona accesos y roles del sistema.</p>
                </div>
                <button
                    onClick={handleOpenCreate}
                    className="bg-gray-900 text-white px-5 py-3 rounded-xl font-bold shadow-lg hover:bg-black transition active:scale-95 flex items-center gap-2"
                >
                    <Plus size={20} /> Nuevo Usuario
                </button>
            </div>

            <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50/50 border-b border-gray-200">
                        <tr>
                            <th className="p-5 font-bold text-gray-500 text-sm uppercase">Colaborador</th>
                            <th className="p-5 font-bold text-gray-500 text-sm uppercase">Estado</th>
                            <th className="p-5 font-bold text-gray-500 text-sm uppercase">Rol</th>
                            <th className="p-5 font-bold text-gray-500 text-sm uppercase text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {users.map(user => (
                            <tr key={user.id} className="hover:bg-pink-50/30 transition duration-150">
                                <td className="p-5">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold
                                            ${user.isActive !== false ? 'bg-gradient-to-br from-pink-400 to-rose-500' : 'bg-gray-300'}`}>
                                            {(user.username || user.name || "U")[0].toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="font-bold text-gray-800">{user.username || user.name}</div>
                                            <div className="text-xs text-gray-400">{user.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-5">
                                    {user.isActive !== false ? (
                                        <span className="flex items-center gap-1 text-green-600 text-xs font-bold bg-green-50 px-2 py-1 rounded-lg w-fit">
                                            <CheckCircle size={14} /> Activo
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-1 text-gray-500 text-xs font-bold bg-gray-100 px-2 py-1 rounded-lg w-fit">
                                            <XCircle size={14} /> Inactivo
                                        </span>
                                    )}
                                </td>
                                <td className="p-5"><RoleBadge role={user.role} /></td>
                                <td className="p-5 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <button
                                            onClick={() => handleToggleStatus(user)}
                                            className={`p-2 rounded-lg transition ${user.isActive !== false ? 'text-green-500 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-100'}`}
                                            title={user.isActive !== false ? "Desactivar" : "Activar"}
                                        >
                                            {user.isActive !== false ? <Shield size={18} /> : <ShieldOff size={18} />}
                                        </button>
                                        <button
                                            onClick={() => handleEdit(user)}
                                            className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition"
                                        >
                                            <Edit2 size={18} />
                                        </button>
                                        <button onClick={() => handleDelete(user.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition">
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
                        <h2 className="text-2xl font-bold mb-6 text-gray-800">
                            {isEditing ? 'Editar Usuario' : 'Nuevo Colaborador'}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <input
                                required
                                placeholder="Nombre Usuario"
                                className="input-modern w-full p-3 border rounded-xl"
                                value={formData.username}
                                onChange={e => setFormData({ ...formData, username: e.target.value })}
                            />
                            <input
                                required
                                type="email"
                                placeholder="Correo Electrónico"
                                className="input-modern w-full p-3 border rounded-xl"
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                disabled={isEditing} // Email is usually unique identifier
                            />
                            <input
                                type="password"
                                required={!isEditing}
                                placeholder={isEditing ? "Contraseña (dejar en blanco para no cambiar)" : "Contraseña Temporal"}
                                className="input-modern w-full p-3 border rounded-xl"
                                value={formData.password}
                                onChange={e => setFormData({ ...formData, password: e.target.value })}
                            />
                            <select
                                className="input-modern w-full p-3 border rounded-xl"
                                value={formData.role}
                                onChange={e => setFormData({ ...formData, role: e.target.value })}
                            >
                                <option value="EMPLOYEE">Empleado</option>
                                <option value="OWNER">Dueño (Acceso Total)</option>
                                <option value="ADMIN">Admin General</option>
                            </select>

                            {formData.role === 'EMPLOYEE' && (
                                <select
                                    className="input-modern w-full p-3 border rounded-xl"
                                    value={formData.branchId}
                                    onChange={e => setFormData({ ...formData, branchId: e.target.value })}
                                >
                                    <option value="">Asignar a Sucursal...</option>
                                    {branches.map(b => (
                                        <option key={b.id} value={b.id}>{b.name}</option>
                                    ))}
                                </select>
                            )}
                            <div className="flex gap-3 mt-6">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition">Cancelar</button>
                                <button type="submit" className="flex-1 py-3 bg-pink-600 text-white font-bold rounded-xl hover:bg-pink-700 shadow-lg transition">Guardar</button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default TeamPage;
