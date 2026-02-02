import React, { useState, useEffect } from 'react';
import client from '../config/axios';
import PageShell from '../components/ui/PageShell';
import Card from '../components/ui/Card';
import { DollarSign, ArrowUpCircle, ArrowDownCircle, Lock } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CashRegister() {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [data, setData] = useState({ cut: null, movements: [] });

    const fetchData = async () => {
        try {
            const res = await client.get(`/cash/summary?date=${date}`);
            setData(res.data);
        } catch {
            // ignore error
        } finally {
            // setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line
    }, [date]);

    const handleClose = async () => {
        if (!confirm("¿Cerrar caja del día? No se podrán agregar más movimientos.")) return;
        try {
            await client.post('/cash/close', { date });
            toast.success("Caja cerrada");
            fetchData();
        } catch (e) {
            const msg = e.response?.data?.message || "Error al cerrar";
            toast.error(msg);
        }
    };

    const cut = data.cut || {};

    return (
        <PageShell title="Caja y Cortes 💰">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <Card className="bg-green-50 border-green-100">
                    <h3 className="text-green-800 font-bold mb-2">Ingresos</h3>
                    <div className="flex items-center gap-2 text-3xl font-bold text-green-600">
                        <ArrowUpCircle /> ${Number(cut.totalIncome || 0).toLocaleString()}
                    </div>
                </Card>
                <Card className="bg-red-50 border-red-100">
                    <h3 className="text-red-800 font-bold mb-2">Egresos</h3>
                    <div className="flex items-center gap-2 text-3xl font-bold text-red-600">
                        <ArrowDownCircle /> ${Number(cut.totalExpense || 0).toLocaleString()}
                    </div>
                </Card>
                <Card className="bg-blue-50 border-blue-100">
                    <h3 className="text-blue-800 font-bold mb-2">Balance Final</h3>
                    <div className="flex items-center gap-2 text-3xl font-bold text-blue-600">
                        <DollarSign /> ${Number(cut.finalBalance || 0).toLocaleString()}
                    </div>
                </Card>
            </div>

            <Card>
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-4">
                        <h3 className="font-bold text-lg">Movimientos del Día</h3>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="p-2 border rounded-lg text-sm"
                        />
                    </div>
                    {cut.status === 'Open' ? (
                        <button
                            onClick={handleClose}
                            className="bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-black transition flex items-center gap-2"
                        >
                            <Lock size={16} /> Cerrar Caja
                        </button>
                    ) : (
                        <span className="px-3 py-1 bg-red-100 text-red-700 rounded-lg font-bold text-sm">
                            🔐 Caja Cerrada
                        </span>
                    )}
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 text-gray-500">
                            <tr>
                                <th className="p-3">Hora</th>
                                <th className="p-3">Concepto</th>
                                <th className="p-3">Ref</th>
                                <th className="p-3 text-right">Monto</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.movements.map(m => (
                                <tr key={m.id} className="border-b hover:bg-gray-50">
                                    <td className="p-3 text-gray-500">
                                        {new Date(m.createdAt).toLocaleTimeString()}
                                    </td>
                                    <td className="p-3">
                                        <span className={`font-bold ${m.type === 'Income' ? 'text-green-600' : 'text-red-600'}`}>
                                            {m.type === 'Income' ? '+' : '-'} {m.category}
                                        </span>
                                        {m.description && <p className="text-xs text-gray-400">{m.description}</p>}
                                    </td>
                                    <td className="p-3 font-mono text-xs">{m.referenceId || '-'}</td>
                                    <td className={`p-3 text-right font-bold ${m.type === 'Income' ? 'text-green-700' : 'text-red-700'}`}>
                                        ${Number(m.amount).toLocaleString()}
                                    </td>
                                </tr>
                            ))}
                            {data.movements.length === 0 && (
                                <tr>
                                    <td colSpan="4" className="text-center p-8 text-gray-400">
                                        Sin movimientos registrados.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </PageShell>
    );
}
