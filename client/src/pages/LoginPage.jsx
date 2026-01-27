import React from 'react';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { LogIn, Mail, Lock, ArrowRight } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import axios from '../config/axios';
import toast from 'react-hot-toast';
import AnimatedText from '../components/AnimatedText';
import InputGroup from '../components/InputGroup';

const LoginPage = () => {
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();
    const navigate = useNavigate();

    const onSubmit = async (data) => {
        try {
            // 1. Usamos 'client' (axios instance) en vez de 'axios' directo
            const res = await axios.post('/auth/login', data);

            // 2. Si llegamos aquí, es éxito (200 OK)
            console.log("Respuesta del servidor:", res.data);

            // 3. Guardamos el token
            if (res.data.token) {
                localStorage.setItem('token', res.data.token);

                // 4. Feedback al usuario
                const nombre = res.data.user?.name || res.data.user?.username || "Usuario";
                toast.success(
                    <span className="font-medium">¡Bienvenido, {nombre}! 👋</span>
                );

                // 5. Redirección
                navigate('/');
            }

        } catch (error) {
            // 6. MANEJO DE ERRORES (Para evitar el Crash)
            console.error("Error en login:", error);

            if (error.response) {
                // El servidor respondió con un error (404, 401, 500)
                if (error.response.status === 404) {
                    toast.error("Error de conexión: Ruta no encontrada.");
                } else if (error.response.status === 401) {
                    toast.error("Contraseña o correo incorrectos.");
                } else {
                    toast.error(error.response.data.message || "Error al iniciar sesión");
                }
            } else if (error.request) {
                // El servidor no responde (está apagado)
                toast.error("No se puede conectar con el servidor ⚠️");
            } else {
                toast.error("Error desconocido");
            }
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-white rounded-3xl shadow-2xl overflow-hidden w-full max-w-5xl flex flex-col md:flex-row h-[600px]"
            >

                {/* Lado Izquierdo: Visual & Arte */}
                <div className="relative w-full md:w-1/2 bg-gradient-to-br from-pink-500 to-purple-600 p-12 flex flex-col justify-between text-white overflow-hidden">
                    {/* Círculos decorativos animados */}
                    <motion.div
                        animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
                        transition={{ duration: 20, repeat: Infinity }}
                        className="absolute -top-20 -left-20 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl"
                    />
                    <motion.div
                        animate={{ scale: [1, 1.5, 1], rotate: [0, -45, 0] }}
                        transition={{ duration: 15, repeat: Infinity }}
                        className="absolute -bottom-20 -right-20 w-80 h-80 bg-purple-400 opacity-20 rounded-full blur-3xl"
                    />

                    <div className="relative z-10">
                        <h2 className="text-4xl font-bold mb-2">La Fiesta</h2>
                        <p className="opacity-80">Gestión Inteligente de Pastelería</p>
                    </div>

                    <div className="relative z-10 space-y-4">
                        <AnimatedText text="Donde cada detalle" className="text-3xl font-bold" />
                        <AnimatedText text="cuenta una historia dulce." className="text-3xl font-bold text-pink-200" />
                    </div>

                    <div className="relative z-10 text-sm opacity-70">
                        © 2026 Sistema Integral v2.0
                    </div>
                </div>

                {/* Lado Derecho: Formulario */}
                <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center bg-white relative">
                    <div className="max-w-sm mx-auto w-full">
                        <div className="mb-10">
                            <h3 className="text-3xl font-bold text-gray-800 mb-2">Iniciar Sesión</h3>
                            <p className="text-gray-500">Ingresa tus credenciales para acceder al panel.</p>
                        </div>

                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                            <InputGroup
                                icon={Mail}
                                type="email"
                                placeholder="Correo Electrónico"
                                name="email"
                                register={register}
                                error={errors.email}
                            />

                            <InputGroup
                                icon={Lock}
                                type="password"
                                placeholder="Contraseña"
                                name="password"
                                register={register}
                                error={errors.password}
                            />

                            <div className="flex justify-end">
                                <a href="#" className="text-sm text-pink-500 hover:text-pink-700 font-medium">
                                    ¿Olvidaste tu contraseña?
                                </a>
                            </div>

                            <button
                                disabled={isSubmitting}
                                className="w-full bg-gray-900 text-white py-4 rounded-xl font-bold shadow-lg hover:bg-black transition-all active:scale-95 flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? (
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ repeat: Infinity, duration: 1 }}
                                        className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                                    />
                                ) : (
                                    <>
                                        Entrar al Sistema
                                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="mt-8 text-center">
                            <p className="text-gray-500">
                                ¿No tienes cuenta?{' '}
                                <Link to="/registro" className="text-pink-600 font-bold hover:underline">
                                    Crear cuenta nueva
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>

            </motion.div>
        </div>
    );
};

export default LoginPage;
