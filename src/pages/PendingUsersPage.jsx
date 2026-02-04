import React, { useState, useEffect } from 'react';
import axios from '../config/axios';
import { activationApi } from '../services/activationApi';
import { UserPlus, RefreshCw, Copy, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const PendingUsersPage = () => {
    const [pendingUsers, setPendingUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [generationLoading, setGenerationLoading] = useState(false);
    const [details, setDetails] = useState(null); // { code, expiresAt }

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const res = await axios.get('/users/pending');
            setPendingUsers(res.data);
            // We could also fetch limits here if we had an endpoint
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleGenerateCode = async () => {
        setGenerationLoading(true);
        try {
            const data = await activationApi.generateCode();
            setDetails(data);
            toast.success("Código generado correctamente");
        } catch (error) {
            console.error(error);
            const msg = error.response?.data?.message || "Error generando código";
            toast.error(msg);
        } finally {
            setGenerationLoading(false);
        }
    };

    const copyCode = () => {
        if (details?.code) {
            navigator.clipboard.writeText(details.code);
            toast.success("Copiado al portapapeles");
        }
    };

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <UserPlus className="text-pink-500" />
                        Activación de Usuarios
                    </h1>
                    <p className="text-gray-500 text-sm">Administra las solicitudes de acceso y genera códigos para nuevos empleados.</p>
                </div>

                <button
                    onClick={handleGenerateCode}
                    disabled={generationLoading}
                    className="bg-gray-900 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:bg-black transition-all flex items-center gap-2 disabled:opacity-50"
                >
                    {generationLoading ? <RefreshCw className="animate-spin" size={20} /> : <CheckCircle size={20} />}
                    Generar Nuevo Código
                </button>
            </header>

            {/* Code Display Area */}
            {details && (
                <div className="mb-8 bg-green-50 border border-green-200 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 animate-in slide-in-from-top-4 fade-in">
                    <div className="text-center md:text-left">
                        <h3 className="text-green-800 font-bold text-lg mb-1">Código de Activación Listo</h3>
                        <p className="text-green-600 text-sm">
                            Comparte este código con el usuario. Expira: {new Date(details.expiresAt).toLocaleTimeString()}
                        </p>
                    </div>

                    <div className="flex items-center gap-4 bg-white p-2 rounded-xl border border-green-100 shadow-sm">
                        <code className="text-3xl font-mono font-bold tracking-widest text-gray-800 px-4">
                            {details.code}
                        </code>
                        <button onClick={copyCode} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors">
                            <Copy size={20} />
                        </button>
                    </div>
                </div>
            )}

            {/* List of Pending Users */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="font-bold text-gray-700">Usuarios Pendientes ({pendingUsers.length})</h3>
                    <button onClick={fetchUsers} className="text-gray-400 hover:text-gray-600">
                        <RefreshCw size={18} />
                    </button>
                </div>

                {loading ? (
                    <div className="p-8 text-center text-gray-400 py-20">Cargando...</div>
                ) : pendingUsers.length === 0 ? (
                    <div className="p-12 text-center text-gray-400">
                        <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <UserPlus size={24} className="opacity-50" />
                        </div>
                        <p>No hay usuarios esperando activación.</p>
                    </div>
                ) : (
                    <table className="w-full text-left text-sm text-gray-600">
                        <thead className="bg-gray-50 text-xs uppercase font-bold text-gray-500">
                            <tr>
                                <th className="px-6 py-4">Usuario</th>
                                <th className="px-6 py-4">Correo</th>
                                <th className="px-6 py-4">Fecha Reg.</th>
                                <th className="px-6 py-4">Estado</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {pendingUsers.map(user => (
                                <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-gray-900">{user.username}</td>
                                    <td className="px-6 py-4">{user.email}</td>
                                    <td className="px-6 py-4">{new Date(user.createdAt).toLocaleDateString()}</td>
                                    <td className="px-6 py-4">
                                        <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-bold">
                                            {user.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default PendingUsersPage;
