import { useEffect, useState } from "react";
import PageShell from "../components/ui/PageShell";
import Card from "../components/ui/Card";
import client from "../config/axios";
import { MessageCircle, User, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import toast from "react-hot-toast";

export default function InboxPage() {
    const [sessions, setSessions] = useState([]);

    const load = async () => {
        try {
            const { data } = await client.get('/ai-sessions/inbox/list');
            setSessions(data);
        } catch (e) {
            console.error("Inbox load error", e);
        }
    };

    useEffect(() => { load(); }, []);

    const handlePriority = async (id, priority) => {
        try {
            await client.patch(`/ai-sessions/${id}/priority`, { priority });
            load();
        } catch (e) { toast.error("Error updating priority"); }
    };

    const handleTakeCase = async (id) => {
        // Logic to take over chat, maybe redirect to chat view or just mark as human needed = false?
        // For now, let's just mark needsHuman = false to "resolve" the alert
        try {
            await client.patch(`/ai-sessions/${id}/needs-human`, { needsHuman: false });
            toast.success("Caso tomado / Alerta resuelta");
            load();
        } catch (e) { toast.error("Error"); }
    };

    const priorityColor = (p) => {
        if (p === 'urgente') return 'text-red-600 bg-red-50 border-red-200';
        if (p === 'alta') return 'text-orange-600 bg-orange-50 border-orange-200';
        return 'text-gray-600 bg-gray-50 border-gray-200';
    };

    return (
        <PageShell title="Bandeja de Entrada WhatsApp">
            <div className="grid gap-4">
                {sessions.length === 0 && (
                    <Card className="text-center py-10 text-gray-500">
                        <MessageCircle size={48} className="mx-auto mb-2 opacity-20" />
                        <p>No hay mensajes pendientes de atención.</p>
                    </Card>
                )}
                {sessions.map(s => (
                    <Card key={s.id} className={`flex flex-col md:flex-row gap-4 border-l-4 ${s.needsHuman ? 'border-l-red-500' : 'border-l-gray-300'}`}>
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                {s.needsHuman && <span className="flex items-center gap-1 text-xs font-bold bg-red-100 text-red-600 px-2 py-1 rounded-full"><AlertTriangle size={12} /> NECESITA HUMANO</span>}
                                <span className={`text-xs font-bold px-2 py-1 rounded-full border ${priorityColor(s.priority)} uppercase`}>{s.priority}</span>
                                <span className="text-xs text-gray-400 flex items-center gap-1"><Clock size={12} /> {new Date(s.updatedAt).toLocaleString()}</span>
                            </div>
                            <h3 className="font-bold text-lg flex items-center gap-2">
                                <User size={18} className="text-gray-400" />
                                {s.customerName || 'Cliente Desconocido'}
                                <span className="text-sm font-normal text-gray-500">({s.customerPhone})</span>
                            </h3>
                            <p className="text-gray-600 text-sm mt-2 line-clamp-2 bg-gray-50 p-2 rounded italic border border-gray-100">
                                "{JSON.parse(s.whatsappConversation || '[]').slice(-1)[0]?.content || '...'}"
                            </p>
                        </div>
                        <div className="flex flex-col gap-2 justify-center min-w-[140px]">
                            <button onClick={() => handleTakeCase(s.id)} className="bg-green-600 text-white px-3 py-2 rounded-lg font-bold text-sm hover:bg-green-700 transition flex items-center justify-center gap-2 shadow-sm">
                                <CheckCircle size={16} /> Resolver
                            </button>
                            <div className="flex gap-1 justify-center">
                                <button onClick={() => handlePriority(s.id, 'alta')} className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded hover:bg-orange-200">Alta</button>
                                <button onClick={() => handlePriority(s.id, 'urgente')} className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200">Urgente</button>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        </PageShell>
    );
}
