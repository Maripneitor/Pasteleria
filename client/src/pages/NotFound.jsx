import React from 'react';
import { Link } from 'react-router-dom';
import { Home, AlertCircle } from 'lucide-react';

const NotFound = () => {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-center p-4">
            <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full border border-gray-100">
                <div className="w-20 h-20 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <AlertCircle size={40} className="text-pink-500" />
                </div>
                <h1 className="text-4xl font-bold text-gray-800 mb-2">404</h1>
                <h2 className="text-xl font-semibold text-gray-600 mb-4">¡Ups! Página no encontrada</h2>
                <p className="text-gray-500 mb-8">
                    Parece que el pastel que buscas ya se vendió o nunca existió.
                </p>
                <Link to="/" className="flex items-center justify-center gap-2 w-full py-3 bg-pink-500 text-white rounded-xl font-bold hover:bg-pink-600 transition active:scale-95">
                    <Home size={20} /> Volver al Inicio
                </Link>
            </div>
        </div>
    );
};

export default NotFound;
