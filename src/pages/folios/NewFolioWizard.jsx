import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import OrderWizardLayout from '../../components/OrderWizardLayout';
import { useOrder } from '../../context/OrderContext';
import foliosApi from '../../services/folios';
import catalogApi from '../../services/catalogApi'; // NEW
import ClientAutocomplete from './wizard/ClientAutocomplete'; // NEW
import toast from 'react-hot-toast';

const NewFolioWizard = () => {
    const { step, setStep, orderData, updateOrder, nextStep, prevStep } = useOrder();
    const navigate = useNavigate();
    const [submitting, setSubmitting] = useState(false);

    // Catalog State
    const [flavors, setFlavors] = useState([]);
    const [fillings, setFillings] = useState([]);
    const [products, setProducts] = useState([]); // NEW

    // Load Catalogs on Mount
    React.useEffect(() => {
        const loadCatalogs = async () => {
            try {
                const [fData, cData, pData] = await Promise.all([
                    catalogApi.getFlavors(false),
                    catalogApi.getFillings(false),
                    catalogApi.getProducts(false) // NEW
                ]);
                setFlavors(fData);
                setFillings(cData);
                setProducts(pData); // NEW
            } catch (error) {
                console.error("Error loading catalogs", error);
                toast.error("Error cargando catálogos");
            }
        };
        loadCatalogs();
    }, []);

    // --- Steps Renderers ---

    // Step 1: Client
    const renderStep1 = () => (
        <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-700">Datos del Cliente</h2>
            <div>
                <ClientAutocomplete
                    selectedClient={orderData.selectedClient}
                    onSelect={(client) => {
                        updateOrder({
                            selectedClient: client,
                            clientName: client ? client.name : '',
                            clientPhone: client ? client.phone : ''
                        });
                    }}
                />
            </div>

            {/* Fallback Display if needed */}
            {orderData.selectedClient && (
                <div className="bg-pink-50 p-4 rounded-xl border border-pink-100 mt-2">
                    <p className="font-bold text-gray-800">{orderData.clientName}</p>
                    <p className="text-sm text-gray-600">{orderData.clientPhone}</p>
                </div>
            )}

            <div className="flex justify-end mt-6">
                <button
                    onClick={nextStep}
                    disabled={!orderData.clientName}
                    className="bg-pink-500 text-white px-6 py-2 rounded-lg hover:bg-pink-600 disabled:bg-gray-300 transition"
                >
                    Siguiente
                </button>
            </div>
        </div>
    );

    // Step 2: Products (From Catalog)
    const renderStep2 = () => (
        <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-700">Detalles del Pastel</h2>

            {/* PRODUCT BASE SELECTION */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Producto Base (Pastel)</label>
                <select
                    value={orderData.productId || ''}
                    onChange={(e) => {
                        const id = e.target.value;
                        const product = products.find(p => p.id.toString() === id);
                        updateOrder({
                            productId: id,
                            productName: product ? product.name : '',
                            // Optionally set base price if needed
                            // total: product ? product.price : orderData.total
                        });
                    }}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                >
                    <option value="">Seleccione Producto Base</option>
                    {products.map(p => (
                        <option key={p.id} value={p.id}>{p.name} - ${p.price}</option>
                    ))}
                </select>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sabor del Pan</label>
                <select
                    value={orderData.flavorId || ''}
                    onChange={(e) => {
                        const id = e.target.value;
                        const flavor = flavors.find(f => f.id.toString() === id);
                        updateOrder({ flavorId: id, flavorText: flavor ? flavor.name : '' });
                    }}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                >
                    <option value="">Seleccione Sabor</option>
                    {flavors.map(f => (
                        <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Relleno</label>
                <select
                    value={orderData.fillingId || ''}
                    onChange={(e) => {
                        const id = e.target.value;
                        const filling = fillings.find(f => f.id.toString() === id);
                        updateOrder({ fillingId: id, fillingText: filling ? filling.name : '' });
                    }}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                >
                    <option value="">Seleccione Relleno</option>
                    {fillings.map(f => (
                        <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción / Diseño</label>
                <textarea
                    value={orderData.designDescription || ''}
                    onChange={(e) => updateOrder({ designDescription: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg h-24"
                    placeholder="Describa el diseño, colores, mensaje..."
                />
            </div>
            <div className="flex justify-between mt-6">
                <button onClick={prevStep} className="text-gray-500 hover:text-gray-700">Atrás</button>
                <button
                    onClick={nextStep}
                    disabled={!orderData.flavorId || !orderData.fillingId || !orderData.productId} // Validation
                    className="bg-pink-500 text-white px-6 py-2 rounded-lg hover:bg-pink-600 transition disabled:bg-gray-300"
                >
                    Siguiente
                </button>
            </div>
        </div>
    );

    // Step 3: Delivery
    const renderStep3 = () => (
        <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-700">Entrega</h2>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Entrega</label>
                    <input
                        type="date"
                        value={orderData.deliveryDate}
                        onChange={(e) => updateOrder({ deliveryDate: e.target.value })}
                        className="w-full p-2 border border-gray-300 rounded-lg"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Hora</label>
                    <input
                        type="time"
                        value={orderData.deliveryTime}
                        onChange={(e) => updateOrder({ deliveryTime: e.target.value })}
                        className="w-full p-2 border border-gray-300 rounded-lg"
                    />
                </div>
            </div>
            <div className="flex justify-between mt-6">
                <button onClick={prevStep} className="text-gray-500 hover:text-gray-700">Atrás</button>
                <button
                    onClick={nextStep}
                    disabled={!orderData.deliveryDate}
                    className="bg-pink-500 text-white px-6 py-2 rounded-lg hover:bg-pink-600 disabled:bg-gray-300 transition"
                >
                    Siguiente
                </button>
            </div>
        </div>
    );

    // Step 4: Summary & Submit
    const handleFinish = async () => {
        setSubmitting(true);
        try {
            // Build Payload
            // Build Payload
            const payload = {
                cliente_nombre: orderData.clientName,
                cliente_telefono: orderData.clientPhone,
                clientId: orderData.selectedClient?.id || null, // NEW Field
                fecha_entrega: orderData.deliveryDate,
                hora_entrega: orderData.deliveryTime,
                descripcion_diseno: orderData.designDescription,

                // Compatibility and Real Data
                sabores_pan: [orderData.flavorText || 'Estándar'],
                rellenos: [orderData.fillingText || 'Estándar'],
                flavorIds: [orderData.flavorId], // Array as per prompt
                fillingIds: [orderData.fillingId], // Array as per prompt

                total: parseFloat(orderData.total || 0),
                anticipo: parseFloat(orderData.advance || 0),
                status: 'CONFIRMED'
            };

            const newFolio = await foliosApi.createFolio(payload);
            toast.success('Pedido creado con éxito');
            navigate(`/folios/${newFolio.id}`);

            // Should clear context? 
            // setOrderData(initialState) -> ideally done in context
        } catch (error) {
            console.error(error);
            toast.error('Error al crear el pedido');
        } finally {
            setSubmitting(false);
        }
    };

    const renderStep4 = () => (
        <div className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-700">Resumen y Pago</h2>

            <div className="bg-gray-50 p-4 rounded-lg text-sm space-y-2">
                <p><strong>Cliente:</strong> {orderData.clientName}</p>
                <p><strong>Entrega:</strong> {orderData.deliveryDate} {orderData.deliveryTime}</p>
                <p><strong>Pastel:</strong> {orderData.flavorText} / {orderData.fillingText}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Total ($)</label>
                    <input
                        type="number"
                        value={orderData.total}
                        onChange={(e) => updateOrder({ total: e.target.value })}
                        className="w-full p-2 border border-gray-300 rounded-lg font-bold text-lg"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Anticipo ($)</label>
                    <input
                        type="number"
                        value={orderData.advance}
                        onChange={(e) => updateOrder({ advance: e.target.value })}
                        className="w-full p-2 border border-gray-300 rounded-lg text-lg"
                    />
                </div>
            </div>

            <div className="flex justify-between mt-6">
                <button onClick={prevStep} className="text-gray-500 hover:text-gray-700">Atrás</button>
                <button
                    onClick={handleFinish}
                    disabled={submitting}
                    className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 transition font-bold shadow-lg"
                >
                    {submitting ? 'Guardando...' : 'Finalizar Pedido'}
                </button>
            </div>
        </div>
    );

    return (
        <OrderWizardLayout title="Nuevo Pedido">
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}
            {step === 4 && renderStep4()}
        </OrderWizardLayout>
    );
};

export default NewFolioWizard;
