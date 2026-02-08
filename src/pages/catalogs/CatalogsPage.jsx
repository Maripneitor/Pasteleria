import React, { useState, useEffect } from 'react';
import { Package, Layers, Droplet, Star, Plus } from 'lucide-react';
import catalogApi from '../../services/catalogApi';
import toast from 'react-hot-toast';

const TabButton = ({ active, onClick, icon: Icon, label }) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-2 px-6 py-3 font-medium transition-all border-b-2 ${active
                ? 'border-pink-500 text-pink-600 bg-pink-50/50'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
    >
        <Icon size={18} />
        {label}
    </button>
);

const CatalogTable = ({ items, onToggle, columns }) => {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-left">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500 font-semibold">
                    <tr>
                        {columns.map((col, i) => (
                            <th key={i} className="px-6 py-4">{col.header}</th>
                        ))}
                        <th className="px-6 py-4 text-right">Estado</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {items.length === 0 ? (
                        <tr>
                            <td colSpan={columns.length + 1} className="px-6 py-8 text-center text-gray-400">
                                No hay elementos registrados
                            </td>
                        </tr>
                    ) : (
                        items.map((item) => (
                            <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                                {columns.map((col, i) => (
                                    <td key={i} className="px-6 py-4 text-sm text-gray-700">
                                        {col.render ? col.render(item) : item[col.key]}
                                    </td>
                                ))}
                                <td className="px-6 py-4 text-right">
                                    <button
                                        onClick={() => onToggle(item.id, !item.isActive)}
                                        className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${item.isActive
                                                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                            }`}
                                    >
                                        {item.isActive ? 'Activo' : 'Inactivo'}
                                    </button>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
};

const CreateModal = ({ isOpen, onClose, title, fields, onSubmit }) => {
    const [formData, setFormData] = useState({});

    useEffect(() => {
        if (!isOpen) setFormData({});
    }, [isOpen]);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 animate-in fade-in zoom-in duration-200">
                <h3 className="text-lg font-bold text-gray-800 mb-4">{title}</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {fields.map((field) => (
                        <div key={field.name}>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                {field.label}
                            </label>
                            {field.type === 'textarea' ? (
                                <textarea
                                    className="w-full rounded-lg border-gray-300 focus:ring-pink-500 focus:border-pink-500"
                                    rows="3"
                                    onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                                />
                            ) : (
                                <input
                                    type={field.type || 'text'}
                                    className="w-full rounded-lg border-gray-300 focus:ring-pink-500 focus:border-pink-500"
                                    onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                                    step={field.type === 'number' ? '0.01' : undefined}
                                    required={field.required}
                                />
                            )}
                        </div>
                    ))}
                    <div className="flex gap-3 mt-6 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-lg font-bold transition shadow-lg shadow-pink-500/30"
                        >
                            Guardar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default function CatalogsPage() {
    const [activeTab, setActiveTab] = useState('products');
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const loadData = async () => {
        setLoading(true);
        try {
            let res = [];
            if (activeTab === 'products') res = await catalogApi.getProducts(true);
            if (activeTab === 'flavors') res = await catalogApi.getFlavors(true);
            if (activeTab === 'fillings') res = await catalogApi.getFillings(true);
            if (activeTab === 'decorations') res = await catalogApi.getDecorations(true);
            setData(res);
        } catch (error) {
            toast.error('Error cargando datos');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [activeTab]);

    const handleCreate = async (formData) => {
        try {
            if (activeTab === 'products') await catalogApi.createProduct(formData);
            if (activeTab === 'flavors') await catalogApi.createFlavor(formData);
            if (activeTab === 'fillings') await catalogApi.createFilling(formData);
            if (activeTab === 'decorations') await catalogApi.createDecoration(formData);

            toast.success('Elemento creado correctamente');
            setIsModalOpen(false);
            loadData();
        } catch (error) {
            toast.error('Error al crear elemento');
        }
    };

    const handleToggle = async (id, isActive) => {
        try {
            if (activeTab === 'products') await catalogApi.toggleProduct(id, isActive);
            if (activeTab === 'flavors') await catalogApi.toggleFlavor(id, isActive);
            if (activeTab === 'fillings') await catalogApi.toggleFilling(id, isActive);
            if (activeTab === 'decorations') await catalogApi.toggleDecoration(id, isActive);

            setData(prev => prev.map(item => item.id === id ? { ...item, isActive } : item));
            toast.success('Estado actualizado');
        } catch (error) {
            toast.error('Error actualizando estado');
        }
    };

    const getColumns = () => {
        switch (activeTab) {
            case 'products':
                return [
                    { header: 'Producto (Base)', key: 'name' },
                    { header: 'Precio Base', key: 'basePrice', render: (i) => `$${Number(i.basePrice).toFixed(2)}` },
                    { header: 'Descripción', key: 'description' }
                ];
            case 'flavors':
                return [{ header: 'Sabor', key: 'name' }];
            case 'fillings':
                return [{ header: 'Relleno', key: 'name' }];
            case 'decorations':
                return [
                    { header: 'Decoración / Extra', key: 'name' },
                    { header: 'Precio', key: 'price', render: (i) => `$${Number(i.price).toFixed(2)}` }
                ];
            default: return [];
        }
    };

    const getFields = () => {
        const common = [{ name: 'name', label: 'Nombre', required: true }];
        switch (activeTab) {
            case 'products':
                return [
                    ...common,
                    { name: 'basePrice', label: 'Precio Base', type: 'number', required: true },
                    { name: 'description', label: 'Descripción', type: 'textarea' }
                ];
            case 'decorations':
                return [
                    ...common,
                    { name: 'price', label: 'Precio Unitario', type: 'number', required: true }
                ];
            default: return common;
        }
    };

    const getTitle = () => {
        if (activeTab === 'products') return 'Nuevo Producto Base';
        if (activeTab === 'flavors') return 'Nuevo Sabor';
        if (activeTab === 'fillings') return 'Nuevo Relleno';
        if (activeTab === 'decorations') return 'Nueva Decoración/Extra';
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Catálogos y Precios</h1>
                    <p className="text-gray-500 text-sm">Gestiona los productos, sabores y extras disponibles.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-pink-600 hover:bg-pink-700 text-white rounded-xl font-bold shadow-lg shadow-pink-500/30 transition-all hover:scale-105 active:scale-95"
                >
                    <Plus size={20} />
                    Nuevo Elemento
                </button>
            </header>

            <div className="flex border-b border-gray-200 overflow-x-auto">
                <TabButton active={activeTab === 'products'} onClick={() => setActiveTab('products')} icon={Package} label="Productos" />
                <TabButton active={activeTab === 'flavors'} onClick={() => setActiveTab('flavors')} icon={Layers} label="Sabores de Pan" />
                <TabButton active={activeTab === 'fillings'} onClick={() => setActiveTab('fillings')} icon={Droplet} label="Rellenos" />
                <TabButton active={activeTab === 'decorations'} onClick={() => setActiveTab('decorations')} icon={Star} label="Decoraciones y Extras" />
            </div>

            {loading ? (
                <div className="py-12 flex justify-center text-gray-400">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
                </div>
            ) : (
                <CatalogTable
                    items={data}
                    onToggle={handleToggle}
                    columns={getColumns()}
                />
            )}

            <CreateModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={getTitle()}
                fields={getFields()}
                onSubmit={handleCreate}
            />
        </div>
    );
}
