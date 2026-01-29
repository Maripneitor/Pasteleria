import { useEffect, useState } from "react";
import PageShell from "../components/ui/PageShell";
import Card from "../components/ui/Card";
import { ordersApi } from "../services/ordersApi";

const STATUS_FLOW = ["pending", "production", "ready", "delivered"];

export default function ProductionPage() {
    const [items, setItems] = useState([]);

    const load = async () => {
        const { data } = await ordersApi.list();
        setItems(Array.isArray(data) ? data.filter(x => x.status !== "cancelled") : []);
    };

    useEffect(() => { load(); }, []);

    const setStatus = async (id, status) => {
        try {
            await ordersApi.status(id, { status });
            await load();
        } catch (e) {
            console.error("Error setting status", e);
        }
    };

    return (
        <PageShell title="Producción (KDS)">
            <Card>
                <div className="grid gap-3">
                    {items.length === 0 && <p className="text-gray-500 text-center py-4">No hay pedidos pendientes.</p>}
                    {items.map(o => (
                        <div key={o.id} className="border rounded-xl p-4 flex flex-col md:flex-row items-start justify-between gap-3 hover:bg-gray-50 transition">
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="font-mono font-extrabold text-pink-600 bg-pink-50 px-2 py-1 rounded">{o.folioNumber}</span>
                                    <span className="font-bold text-gray-800">{o.clientName}</span>
                                </div>
                                <div className="text-sm text-gray-500 mt-1">
                                    📅 {o.deliveryDate} ⏰ {o.deliveryTime}
                                </div>
                                {o.details?.saboresPan && (
                                    <div className="text-xs text-gray-600 mt-2">
                                        🍰 {o.details.saboresPan.map(s => s.name).join(', ')}
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-2 flex-wrap justify-end">
                                {STATUS_FLOW.map(s => (
                                    <button
                                        key={s}
                                        onClick={() => setStatus(o.id, s)}
                                        className={`px-3 py-2 rounded-xl text-sm font-bold border transition ${o.status === s
                                                ? "bg-gray-900 text-white border-gray-900"
                                                : "bg-white text-gray-600 hover:bg-gray-100"
                                            }`}
                                    >
                                        {s.charAt(0).toUpperCase() + s.slice(1)}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </Card>
        </PageShell>
    );
}
