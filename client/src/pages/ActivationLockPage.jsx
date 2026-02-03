import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { activationApi } from '../services/activationApi';
import toast from 'react-hot-toast';
import { Lock, ShieldCheck, LogOut } from 'lucide-react';

const ActivationLockPage = () => {
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // Recover temp token
    const tempToken = localStorage.getItem('temp_activation_token');

    // If no temp token, maybe they are already active or just loose?
    // Redirect to login if absolutely nothing exists
    useEffect(() => {
        if (!tempToken) {
            // Optional: Check if we have a real token?
            // For now, if no temp token, assume intruder.
            // toast.error("Sesión de activación inválida");
            // navigate('/login');
        }
    }, [tempToken, navigate]);

    const handleVerify = async (e) => {
        e.preventDefault();
        if (code.length !== 6) return toast.error("El código debe tener 6 dígitos");

        setLoading(true);
        try {
            await activationApi.verifyCode(code, tempToken);
            toast.success("¡Cuenta activada! Inicia sesión.");

            // Clean up
            localStorage.removeItem('temp_activation_token');
            navigate('/login');

        } catch (error) {
            console.error(error);
            const msg = error.response?.data?.message || "Error al verificar código";
            if (error.response?.status === 409) { // Limit reached
                toast.error("Límite de usuarios del dueño alcanzado 🛑");
            } else {
                toast.error(msg);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('temp_activation_token');
        localStorage.removeItem('token'); // just in case
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            >
                <div className="bg-gradient-to-r from-red-500 to-pink-600 p-8 text-center text-white">
                    <div className="mx-auto bg-white/20 w-16 h-16 rounded-full flex items-center justify-center mb-4 backdrop-blur-sm">
                        <Lock size={32} />
                    </div>
                    <h2 className="text-2xl font-bold mb-1">Cuenta Pendiente</h2>
                    <p className="text-red-100 text-sm">Tu acceso requiere activación</p>
                </div>

                <div className="p-8">
                    <p className="text-gray-600 mb-6 text-center text-sm">
                        Solicita tu código de 6 dígitos al Administrador o Dueño de la sucursal para activar tu cuenta.
                    </p>

                    <form onSubmit={handleVerify} className="space-y-6">
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Código de Activación</label>
                            <input
                                type="text"
                                maxLength={6}
                                value={code}
                                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} // Numbers only
                                className="w-full text-center text-3xl tracking-[0.5em] font-mono border-2 border-gray-200 rounded-xl py-3 focus:border-pink-500 focus:ring-0 outline-none transition-all placeholder:tracking-normal"
                                placeholder="000000"
                                autoFocus
                            />
                        </div>

                        <button
                            disabled={loading || code.length < 6}
                            className="w-full bg-gray-900 text-white py-4 rounded-xl font-bold shadow-lg hover:bg-black transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? 'Verificando...' : (
                                <>
                                    <ShieldCheck size={20} />
                                    Activar Cuenta
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-6 pt-6 border-t border-gray-100 text-center">
                        <button onClick={handleLogout} className="text-gray-400 hover:text-gray-600 text-sm font-medium flex items-center justify-center gap-2 mx-auto">
                            <LogOut size={16} /> Cancelar y Salir
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default ActivationLockPage;
