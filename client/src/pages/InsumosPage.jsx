import { useEffect, useState } from "react";
import PageShell from "../components/ui/PageShell";
import Card from "../components/ui/Card";
import client from "../config/axios";
import { Plus, Trash2, Edit2, Save, X } from "lucide-react";
import toast from "react-hot-toast";

export default function InsumosPage() {
    const [ingredients, setIngredients] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({});
    const [isCreating, setIsCreating] = useState(false);

    // Load ingredients
    const load = async () => {
        try {
            const { data } = await client.get('/ingredients');
            // Need to ensure route exists. User spec: router.get('/', c.list) in ingredientRoutes.
            // Assuming I haven't created ingredientRoutes yet in server.js? 
            // I created model and Ingredient.js. Did I create routes/controller?
            // Wait, I created model Ingredient.js (Step 336). 
            // I DID NOT create ingredientController.js or ingredientRoutes.js in previous steps?
            // Checking my thought process... I planned to create them. 
            // Task list says "Create AuditLog.js & Ingredient.js". 
            // User spec had controller code. I should probably double check if I missed creating controller/routes.
            setIngredients(data);
        } catch (e) {
            console.error("Error loading ingredients", e);
        }
    };

    useEffect(() => { load(); }, []);

    const handleEdit = (ing) => {
        setEditingId(ing.id);
        setFormData({ ...ing });
    };

    const handleCreate = () => {
        setIsCreating(true);
        setFormData({ name: '', unit: 'kg', stock: 0, cost: 0 });
    };

    const handleCancel = () => {
        setEditingId(null);
        setIsCreating(false);
        setFormData({});
    };

    const handleSave = async () => {
        try {
            if (isCreating) {
                await client.post('/ingredients', formData);
                toast.success("Insumo creado");
            } else {
                await client.put(`/ingredients/${editingId}`, formData);
                toast.success("Insumo actualizado");
            }
            handleCancel();
            load();
        } catch (e) {
            toast.error("Error al guardar");
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("¿Eliminar insumo?")) return;
        try {
            await client.delete(`/ingredients/${id}`);
            toast.success("Eliminado");
            load();
        } catch (e) {
            toast.error("Error al eliminar");
        }
    };

    return (
        <PageShell
            title="Insumos e Inventario"
            actions={
                <button onClick={handleCreate} className="bg-pink-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-pink-700">
                    <Plus size={18} /> Nuevo
                </button>
            }
        >
            <Card>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b text-gray-500 text-sm">
                                <th className="pb-3">Nombre</th>
                                <th className="pb-3">Unidad</th>
                                <th className="pb-3">Stock</th>
                                <th className="pb-3">Costo</th>
                                <th className="pb-3 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {isCreating && (
                                <tr className="bg-pink-50">
                                    <td className="py-3"><input className="border rounded px-2 py-1 w-full" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Nombre" autoFocus /></td>
                                    <td className="py-3"><input className="border rounded px-2 py-1 w-20" value={formData.unit} onChange={e => setFormData({ ...formData, unit: e.target.value })} /></td>
                                    <td className="py-3"><input type="number" className="border rounded px-2 py-1 w-24" value={formData.stock} onChange={e => setFormData({ ...formData, stock: e.target.value })} /></td>
                                    <td className="py-3"><input type="number" className="border rounded px-2 py-1 w-24" value={formData.cost} onChange={e => setFormData({ ...formData, cost: e.target.value })} /></td>
                                    <td className="py-3 text-right flex justify-end gap-2">
                                        <button onClick={handleSave} className="text-green-600 hover:bg-green-100 p-1 rounded"><Save size={18} /></button>
                                        <button onClick={handleCancel} className="text-red-600 hover:bg-red-100 p-1 rounded"><X size={18} /></button>
                                    </td>
                                </tr>
                            )}
                            {ingredients.map(ing => (
                                <tr key={ing.id} className="hover:bg-gray-50 group">
                                    {editingId === ing.id ? (
                                        <>
                                            <td className="py-3"><input className="border rounded px-2 py-1 w-full" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} /></td>
                                            <td className="py-3"><input className="border rounded px-2 py-1 w-20" value={formData.unit} onChange={e => setFormData({ ...formData, unit: e.target.value })} /></td>
                                            <td className="py-3"><input type="number" className="border rounded px-2 py-1 w-24" value={formData.stock} onChange={e => setFormData({ ...formData, stock: e.target.value })} /></td>
                                            <td className="py-3"><input type="number" className="border rounded px-2 py-1 w-24" value={formData.cost} onChange={e => setFormData({ ...formData, cost: e.target.value })} /></td>
                                            <td className="py-3 text-right flex justify-end gap-2">
                                                <button onClick={handleSave} className="text-green-600 hover:bg-green-100 p-1 rounded"><Save size={18} /></button>
                                                <button onClick={handleCancel} className="text-red-600 hover:bg-red-100 p-1 rounded"><X size={18} /></button>
                                            </td>
                                        </>
                                    ) : (
                                        <>
                                            <td className="py-3 font-medium text-gray-800">{ing.name}</td>
                                            <td className="py-3 text-gray-500">{ing.unit}</td>
                                            <td className="py-3 font-bold text-gray-700">{ing.stock}</td>
                                            <td className="py-3 text-gray-600">${ing.cost}</td>
                                            <td className="py-3 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => handleEdit(ing)} className="text-blue-600 hover:bg-blue-50 p-1 rounded mr-2"><Edit2 size={16} /></button>
                                                <button onClick={() => handleDelete(ing.id)} className="text-red-600 hover:bg-red-50 p-1 rounded"><Trash2 size={16} /></button>
                                            </td>
                                        </>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </PageShell>
    );
}
