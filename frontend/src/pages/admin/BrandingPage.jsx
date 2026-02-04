import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import api from '../../config/axios';
import toast from 'react-hot-toast';
import { Palette, Save, Eye, Briefcase } from 'lucide-react';

const BrandingPage = () => {
    const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm();
    const [loading, setLoading] = useState(false);

    // Watch fields for live preview
    const logoUrl = watch('logoUrl');
    const businessName = watch('businessName');
    const primaryColor = watch('primaryColor') || '#ec4899';

    useEffect(() => {
        loadBranding();
    }, []);

    const loadBranding = async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/pdf-templates/my-branding');
            setValue('businessName', data.businessName);
            setValue('logoUrl', data.logoUrl);
            setValue('footerText', data.footerText);
            setValue('primaryColor', data.primaryColor || '#ec4899');
        } catch (error) {
            console.error(error);
            toast.error("Error cargando branding actual");
        } finally {
            setLoading(false);
        }
    };

    const onSubmit = async (data) => {
        try {
            setLoading(true);
            await api.post('/pdf-templates/my-branding', data);
            toast.success("Branding actualizado correctamente 🎨");
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || "Error guardando cambios");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6">
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-3 text-gray-800">
                <Palette className="text-pink-600" /> Branding & PDF
            </h1>
            <p className="text-gray-500 mb-8">Personaliza cómo se ven tus tickets y reportes PDF.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Formulario */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-fit">
                    <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                        <Briefcase size={20} className="text-gray-400" /> Configuración
                    </h2>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Negocio</label>
                            <input
                                {...register('businessName', { required: "El nombre es requerido" })}
                                placeholder="Ej: Pastelería Super Delicias"
                                className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 outline-none transition-all"
                            />
                            {errors.businessName && <span className="text-red-500 text-xs">{errors.businessName.message}</span>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Logo URL (Imagen)</label>
                            <input
                                {...register('logoUrl')}
                                placeholder="https://mi-sitio.com/logo.png"
                                className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 outline-none transition-all"
                            />
                            <p className="text-xs text-gray-400 mt-1">Recomendado: PNG fondo transparente. Usa un link público (Dropbox, Imgur, tu web).</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Color Principal (Hex)</label>
                            <div className="flex gap-2 items-center">
                                <input
                                    type="color"
                                    {...register('primaryColor')}
                                    className="h-10 w-20 rounded cursor-pointer border-0 p-0"
                                />
                                <input
                                    type="text"
                                    {...register('primaryColor')}
                                    className="flex-1 p-2 border border-gray-200 rounded-xl uppercase text-sm"
                                    maxLength={7}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Texto al Pie (Footer)</label>
                            <textarea
                                {...register('footerText')}
                                placeholder="Gracias por su preferencia..."
                                className="w-full p-3 border border-gray-200 rounded-xl h-24 focus:ring-2 focus:ring-pink-500 outline-none transition-all resize-none"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 bg-gray-900 text-white rounded-xl font-bold shadow hover:bg-black transition-all active:scale-95 disabled:opacity-50 flex justify-center items-center gap-2"
                        >
                            {loading ? 'Guardando...' : <><Save size={18} /> Guardar Cambios</>}
                        </button>
                    </form>
                </div>

                {/* Live Preview (Simulated) */}
                <div className="space-y-4">
                    <h2 className="font-bold text-lg flex items-center gap-2">
                        <Eye size={20} className="text-gray-400" /> Vista Previa (Simulada)
                    </h2>

                    <div className="bg-white border rounded-none shadow-md p-8 min-h-[500px] relative font-sans text-gray-800 transform hover:scale-[1.01] transition-transform duration-500">
                        {/* Header Branding */}
                        <div className="flex justify-between items-start border-b-4 pb-4 mb-6" style={{ borderColor: primaryColor }}>
                            <div>
                                {logoUrl ? (
                                    <img src={logoUrl} alt="Logo Preview" className="h-16 object-contain mb-2" onError={(e) => e.target.style.display = 'none'} />
                                ) : (
                                    <div className="h-16 w-32 bg-gray-100 flex items-center justify-center text-xs text-gray-400 rounded border border-dashed mb-2">Sin Logo</div>
                                )}
                                <h1 className="text-2xl font-bold" style={{ color: primaryColor }}>{businessName || 'Nombre de tu Negocio'}</h1>
                                <p className="text-sm text-gray-500">Pastelería Artesanal</p>
                            </div>
                            <div className="text-right text-xs text-gray-500">
                                <p className="font-bold text-lg text-black">Folio #12345</p>
                                <p>Fecha: 05/10/2023</p>
                            </div>
                        </div>

                        {/* Body Mockup */}
                        <div className="space-y-4 opacity-75 grayscale-[20%] pointer-events-none select-none">
                            <div className="bg-gray-50 p-3 rounded border border-gray-100">
                                <p className="text-xs font-bold uppercase text-gray-400 mb-1">Cliente</p>
                                <p className="font-medium">Juan Pérez</p>
                            </div>

                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 text-left">
                                    <tr>
                                        <th className="p-2">Concepto</th>
                                        <th className="p-2 text-right">Importe</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="border-b">
                                        <td className="p-2">Pastel Personalizado 20 Personas</td>
                                        <td className="p-2 text-right">$850.00</td>
                                    </tr>
                                    <tr>
                                        <td className="p-2">Envío a Domicilio</td>
                                        <td className="p-2 text-right">$50.00</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* Footer Branding */}
                        <div className="absolute bottom-8 left-8 right-8 text-center border-t pt-4">
                            <p className="text-2xl font-bold" style={{ color: primaryColor }}>Total: $900.00</p>
                        </div>

                    </div>
                    <p className="text-center text-xs text-gray-400">Esta es una aproximación. El PDF real puede variar ligeramente.</p>
                </div>
            </div>
        </div>
    );
};

export default BrandingPage;
