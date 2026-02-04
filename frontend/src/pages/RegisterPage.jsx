import React from 'react';
import { useForm } from 'react-hook-form';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import { User, Mail, Lock, Phone, ArrowRight } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import axios from '../config/axios';
import toast from 'react-hot-toast';
import InputGroup from '../components/InputGroup';

const RegisterPage = () => {
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();
    const navigate = useNavigate();

    // Health Check al montar (Consistencia con Login)
    React.useEffect(() => {
        const checkServer = async () => {
            try {
                await axios.get('/');
            } catch (error) {
                if (error.response && error.response.status === 404) return; // Server online
                if (error.code === 'ERR_NETWORK' || (error.response && error.response.status >= 500)) {
                    toast.error("El servidor de la pastelería no está disponible 🍰", {
                        duration: 5000,
                        position: 'top-center'
                    });
                }
            }
        };
        checkServer();
    }, []);

    const onSubmit = async (data) => {
        try {
            // Mapeamos 'name' -> 'username' para que coincida con el backend
            const payload = {
                ...data,
                username: data.name
            };

            await axios.post('/auth/register', payload);
            toast.success('¡Cuenta creada! Por favor inicia sesión.', { duration: 5000 });
            navigate('/login');
        } catch (error) {
            console.error("Error en registro:", error);
            if (error.code === 'ERR_NETWORK' || !error.response) {
                toast.error('Error de red: El servidor no responde');
            } else {
                toast.error(error.response?.data?.message || 'Error al registrarse');
            }
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-3xl shadow-2xl overflow-hidden w-full max-w-5xl flex flex-col-reverse md:flex-row h-auto md:h-[700px]"
            >

                {/* Lado Izquierdo: Formulario */}
                <div className="w-full md:w-1/2 p-8 md:p-12 overflow-y-auto">
                    <div className="max-w-sm mx-auto">
                        <h3 className="text-3xl font-bold text-gray-800 mb-2">Únete al Equipo</h3>
                        <p className="text-gray-500 mb-8">Crea tu cuenta para gestionar pedidos.</p>

                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            <InputGroup icon={User} type="text" placeholder="Nombre Completo" name="name" register={register} error={errors.name} />
                            <InputGroup icon={Mail} type="email" placeholder="Correo Electrónico" name="email" register={register} error={errors.email} />
                            <InputGroup icon={Phone} type="tel" placeholder="Teléfono" name="phone" register={register} error={errors.phone} />
                            <InputGroup icon={Lock} type="password" placeholder="Contraseña" name="password" register={register} error={errors.password} />

                            <button
                                disabled={isSubmitting}
                                className="w-full mt-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white py-4 rounded-xl font-bold shadow-lg shadow-pink-500/30 hover:shadow-pink-500/50 transition-all active:scale-95 flex items-center justify-center gap-2"
                            >
                                {isSubmitting ? 'Registrando...' : 'Crear Cuenta'} <ArrowRight size={18} />
                            </button>
                        </form>

                        <div className="mt-6 text-center">
                            <p className="text-gray-500">
                                ¿Ya tienes cuenta?{' '}
                                <Link to="/login" className="text-purple-600 font-bold hover:underline">
                                    Inicia sesión aquí
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>

                {/* Lado Derecho: Arte Visual (Invertido) */}
                <div className="w-full md:w-1/2 bg-gray-900 p-12 flex flex-col justify-center items-center text-center text-white relative overflow-hidden">
                    <motion.div
                        animate={{ y: [0, -10, 0] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        className="relative z-10 mb-8"
                    >
                        {/* Aquí podrías poner el Logo SVG de tu pastelería */}
                        <div className="w-24 h-24 bg-pink-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-pink-500/50">
                            <span className="text-4xl">🎂</span>
                        </div>
                    </motion.div>

                    <h2 className="relative z-10 text-3xl font-bold mb-4">Empieza a Crear Magia</h2>
                    <p className="relative z-10 text-gray-400 max-w-xs mx-auto">
                        Únete a la plataforma líder en gestión pastelera. Controla inventarios, pedidos y entregas en un solo lugar.
                    </p>

                    {/* Elementos de fondo abstractos */}
                    <div className="absolute top-0 right-0 w-full h-full opacity-20 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-purple-500 via-gray-900 to-gray-900"></div>
                </div>

            </motion.div>
        </div>
    );
};

export default RegisterPage;
