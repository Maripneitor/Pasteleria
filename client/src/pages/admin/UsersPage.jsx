import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, Edit2, User } from 'lucide-react';
import axios from '../../config/axios';
import toast from 'react-hot-toast';

const UsersPage = () => {
    const [users, setUsers] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'empleado', phone: '' });

    useEffect(() => { fetchUsers(); }, []);

    const fetchUsers = async () => {
        try {
            const res = await axios.get('/users');
            setUsers(res.data);
        } catch (error) {
            console.error(error);
            // toast.error('Error cargando usuarios'); // Opcional si falla silenciosamente
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('¿Seguro que deseas eliminar este usuario?')) return;
        try {
            await axios.delete(`/users/${id}`);
            toast.success('Usuario eliminado');
            fetchUsers();
        } catch (error) {
            toast.error('No se pudo eliminar');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/users', formData);
            toast.success('Usuario creado exitosamente');
            setShowModal(false);
            setFormData({ name: '', email: '', password: '', role: 'empleado', phone: '' });
            fetchUsers();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Error al crear');
        }
    };

    const RoleBadge = ({ role }) => {
        const styles = {
            admin: 'bg-red-100 text-red-600 border-red-200',
            pastelero: 'bg-pink-100 text-pink-600 border-pink-200',
            cajero: 'bg-blue-100 text-blue-600 border-blue-200',
            empleado: 'bg-gray-100 text-gray-600 border-gray-200'
        };
        return (
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${styles[role] || styles.empleado}`}>
                {role}
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
                    onClick={() => setShowModal(true)}
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
                            <th className="p-5 font-bold text-gray-500 text-sm uppercase">Rol</th>
                            <th className="p-5 font-bold text-gray-500 text-sm uppercase text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {users.map(user => (
                            <tr key={user.id} className="hover:bg-pink-50/30 transition duration-150">
                                <td className="p-5">
                                    <div className="flex items-center gap-4">
                                        <img
                                            src={`https://ui-avatars.com/api/?name=${user.name}&background=random&color=fff`}
                                            className="w-10 h-10 rounded-full shadow-sm" alt="Avatar"
                                        />
                                        <div>
                                            <div className="font-bold text-gray-800">{user.name}</div>
                                            <div className="text-xs text-gray-400">{user.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-5"><RoleBadge role={user.role} /></td>
                                <td className="p-5 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition">
                                            <Edit2 size={18} />
                                        </button>
                                        <button onClick={() => handleDelete(user.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition">
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
                        <h2 className="text-2xl font-bold mb-6 text-gray-800">Nuevo Colaborador</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <input required placeholder="Nombre Completo" className="input-modern w-full" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                            <input required type="email" placeholder="Correo Electrónico" className="input-modern w-full" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                            <input required type="password" placeholder="Contraseña Temporal" className="input-modern w-full" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />
                            <select className="input-modern w-full" value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })}>
                                <option value="empleado">Empleado General</option>
                                <option value="pastelero">Pastelero (Producción)</option>
                                <option value="cajero">Cajero (Ventas)</option>
                                <option value="admin">Administrador Total</option>
                            </select>
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

export default UsersPage;
