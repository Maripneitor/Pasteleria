import React, { useState, useEffect } from 'react';
import { Search, Plus, User, Phone, Mail } from 'lucide-react';
import clientsApi from '../../services/clients';
import CreateClientModal from './CreateClientModal';
import toast from 'react-hot-toast';

export default function ClientsPage() {
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);

    const loadClients = async () => {
        setLoading(true);
        try {
            const data = await clientsApi.listClients({ q: search });
            setClients(data);
        } catch (error) {
            console.error(error);
            toast.error('Error cargando clientes');
        } finally {
            setLoading(false);
        }
    };

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            loadClients();
        }, 500);
        return () => clearTimeout(timer);
    }, [search]);

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Directorio de Clientes</h1>
                    <p className="text-gray-500 text-sm">Administra tu base de datos de clientes y contactos.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-pink-600 hover:bg-pink-700 text-white rounded-xl font-bold shadow-lg shadow-pink-500/30 transition-all hover:scale-105 active:scale-95"
                >
                    <Plus size={20} />
                    Nuevo Cliente
                </button>
            </div>

            {/* Search Bar */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-3">
                <Search className="text-gray-400" />
                <input
                    type="text"
                    placeholder="Buscar por nombre o teléfono..."
                    className="flex-1 bg-transparent border-none focus:ring-0 text-gray-700 placeholder-gray-400"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {/* List */}
            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
                </div>
            ) : clients.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-gray-100 border-dashed">
                    <User className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                    <p className="text-gray-500 font-medium">No se encontraron clientes</p>
                    <button onClick={() => setIsModalOpen(true)} className="text-pink-600 font-bold hover:underline mt-2">
                        Crear el primero
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {clients.map((client) => (
                        <div key={client.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow group">
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-gradient-to-br from-pink-100 to-rose-100 text-pink-600 rounded-full flex items-center justify-center font-bold text-lg">
                                        {client.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-800 line-clamp-1">{client.name}</h3>
                                        <p className="text-xs text-gray-400">Cliente #{client.id}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2 text-sm text-gray-600">
                                <div className="flex items-center gap-2">
                                    <Phone size={14} className="text-gray-400" />
                                    <span className="font-medium">{client.phone}</span>
                                </div>
                                {client.email && (
                                    <div className="flex items-center gap-2">
                                        <Mail size={14} className="text-gray-400" />
                                        <span className="truncate">{client.email}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <CreateClientModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onClientCreated={() => loadClients()}
            />
        </div>
    );
}
