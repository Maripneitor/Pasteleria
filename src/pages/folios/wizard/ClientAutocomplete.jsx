import React, { useState, useEffect, useRef } from 'react';
import { Search, User, X } from 'lucide-react';
import clientsApi from '../../../services/clients';
import CreateClientModal from '../../clients/CreateClientModal';

export default function ClientAutocomplete({ onSelect, selectedClient }) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const wrapperRef = useRef(null);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (query.length > 1 && !selectedClient) {
                setLoading(true);
                try {
                    const data = await clientsApi.searchClients(query);
                    setResults(data);
                    setIsOpen(true);
                } catch (e) {
                    console.error(e);
                } finally {
                    setLoading(false);
                }
            } else {
                setResults([]);
                setIsOpen(false);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [query, selectedClient]);

    // Click outside to close
    useEffect(() => {
        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);

    useEffect(() => {
        if (selectedClient) {
            setQuery(selectedClient.name);
            setIsOpen(false);
        }
    }, [selectedClient]);

    const handleSelect = (client) => {
        onSelect(client);
        setQuery(client.name);
        setIsOpen(false);
    };

    const handleClear = () => {
        onSelect(null);
        setQuery('');
        setResults([]);
    };

    const handleClientCreated = (newClient) => {
        handleSelect(newClient);
    };

    return (
        <div className="relative" ref={wrapperRef}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
                Buscar o Crear Cliente
            </label>
            <div className="relative">
                <input
                    type="text"
                    className={`w-full pl-10 pr-10 py-3 rounded-xl border ${selectedClient ? 'border-green-500 bg-green-50 text-green-900 font-medium' : 'border-gray-300 focus:ring-pink-500 focus:border-pink-500'}`}
                    placeholder="Escribe nombre del cliente..."
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        if (selectedClient) onSelect(null); // Reset if typing again
                    }}
                    disabled={!!selectedClient}
                />
                <Search className={`absolute left-3 top-3.5 ${selectedClient ? 'text-green-600' : 'text-gray-400'}`} size={20} />

                {selectedClient ? (
                    <button
                        onClick={handleClear}
                        className="absolute right-3 top-3.5 text-green-600 hover:text-green-800"
                    >
                        <X size={20} />
                    </button>
                ) : (
                    query.length > 0 && (
                        <button
                            onClick={handleClear}
                            className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"
                        >
                            <X size={20} />
                        </button>
                    )
                )}
            </div>

            {/* Dropdown Results */}
            {isOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white rounded-xl shadow-xl border border-gray-100 max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-100">
                    {loading ? (
                        <div className="p-4 text-center text-gray-400 text-sm">Buscando...</div>
                    ) : results.length > 0 ? (
                        <ul>
                            {results.map((client) => (
                                <li
                                    key={client.id}
                                    onClick={() => handleSelect(client)}
                                    className="px-4 py-3 hover:bg-pink-50 cursor-pointer border-b border-gray-50 last:border-0 flex items-center gap-3"
                                >
                                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-500">
                                        <User size={14} />
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-800">{client.name}</p>
                                        <p className="text-xs text-gray-500">{client.phone}</p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="p-4 text-center">
                            <p className="text-sm text-gray-500 mb-2">No encontrado</p>
                            <button
                                onClick={() => setIsModalOpen(true)}
                                className="text-pink-600 font-bold text-sm hover:underline"
                            >
                                + Crear "{query}"
                            </button>
                        </div>
                    )}
                </div>
            )}

            <CreateClientModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onClientCreated={handleClientCreated}
            />
        </div>
    );
}
