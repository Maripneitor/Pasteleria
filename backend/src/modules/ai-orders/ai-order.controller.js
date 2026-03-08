const aiOrderParsingService = require('../../../services/aiOrderParsingService');
const orderFlowService = require('../../../services/orderFlowService');
const folioService = require('../folios/folio.service'); // Necesario para buscar
const { buildTenantWhere } = require('../../../utils/tenantScope'); // El que faltaba
const asyncHandler = require('../../core/asyncHandler');

// 1. PARSE
exports.parseOrder = asyncHandler(async (req, res) => {
    const { text } = req.body;
    if (!text) return res.status(400).json({ message: 'Text is required' });

    const result = await aiOrderParsingService.parseOrder(text, req.user.tenantId);

    if (!result.valid) {
        return res.status(400).json({
            message: 'Validation Failed',
            errors: result.errors,
            raw: result.data
        });
    }

    const payload = {
        cliente_nombre: result.data.customerName || 'Cliente',
        cliente_telefono: result.data.phone || '000',
        fecha_entrega: result.data.deliveryDate,
        sabores_pan: result.data.flavorId ? [result.data.flavorId] : [],
        descripcion_diseno: result.data.specs
    };

    const draft = await orderFlowService.createDraft(payload, req.user);

    res.json({
        valid: true,
        draft,
        aiAnalysis: result.data
    });
});

// 2. CREATE (IA Real conectada)
exports.createOrder = asyncHandler(async (req, res) => {
    const { userMessage } = req.body;
    console.log("=> 🧠 Procesando pedido real con IA. Mensaje:", userMessage);

    if (!userMessage) return res.status(400).json({ message: 'El mensaje es requerido' });

    // 1. Mandamos el texto al servicio de IA (pasa el texto y el ID de la sucursal/tenant)
    const result = await aiOrderParsingService.parseOrder(userMessage, req.user.tenantId);

    // 2. Si la validación falla (ej. pidió sabor "fresa" pero no existe en la BD)
    if (!result.valid) {
        return res.json({
            isPartial: true,
            message: "Entendí parte del pedido, pero tengo dudas: " + result.errors.join(', ') + ". ¿Me confirmas?",
            extractedData: result.data // Le regresamos lo que sí entendió al borrador
        });
    }

    // 3. Si la IA entendió todo perfecto, armamos el paquete para la BD
    const payload = {
        cliente_nombre: result.data.customerName || 'Cliente Mostrador',
        cliente_telefono: result.data.phone || '0000000000',
        fecha_entrega: result.data.deliveryDate || new Date().toISOString(),
        sabores_pan: result.data.flavorId ? [result.data.flavorId] : [],
        descripcion_diseno: result.data.specs || 'Generado por Asistente IA'
    };

    // 4. Creamos el borrador real en la base de datos
    // 4. Creamos el borrador real en la base de datos
    const draft = await orderFlowService.createDraft(payload, req.user);

    console.log("🚨 DRAFT RAW DEVUELTO POR BD:", JSON.stringify(draft, null, 2));

    // BLINDAJE: Extraemos el ID venga como venga (como objeto, propiedad id, o folio_id)
    const folioId = draft.id || draft.folio_id || draft.folioId || draft;

    // 5. Mandamos la respuesta con las variables EXACTAS que espera tu frontend (AiAssistantTray.jsx)
    res.json({
        ok: true,
        isPartial: false,
        aiConfirmation: `¡Listo! He registrado el pedido para ${payload.cliente_nombre}.`,
        folio: {
            id: folioId, // Aquí aseguramos que el ID nunca sea undefined
            cliente_nombre: payload.cliente_nombre,
            cliente_telefono: payload.cliente_telefono,
            fecha_entrega: payload.fecha_entrega,
            total: draft.total || 0,
            ...draft // Esparcimos lo demás por si aca
        },
        folioNumber: draft.folio || `FOLIO-${folioId}`, 
        extractedData: result.data
    });
});

// 3. EDIT (Mock de prueba)
exports.editOrder = asyncHandler(async (req, res) => {
    const { orderId, editInstruction } = req.body;
    console.log(`=> ✏️ Hit en /edit IA. Orden: ${orderId} | Instrucción: ${editInstruction}`);
    
    res.json({
        ok: true,
        message: `La orden fue actualizada correctamente según tus instrucciones (Simulación).`,
        updatedData: {
            cambiosAplicados: ["fecha_entrega", "sabor_pan"],
            nuevoTotal: 500.00
        }
    });
});

// 4. SEARCH (Búsqueda Real con IA)
exports.searchOrders = asyncHandler(async (req, res) => {
    const { query } = req.body; 
    
    // Ahora sí, buildTenantWhere ya existe aquí
    const tenantFilter = buildTenantWhere(req);

    console.log("=> 🔍 IA analizando búsqueda:", query);

    if (!query) return res.status(400).json({ message: 'La consulta es requerida' });

    // Llamamos al servicio real
    const results = await folioService.listFolios({ q: query }, tenantFilter);

    res.json({
        ok: true,
        message: results.length > 0 
            ? `Encontré ${results.length} pedido(s) para "${query}":` 
            : `No encontré pedidos para "${query}".`,
        results: results.map(f => ({
            id: f.id,
            folio: f.folioNumber,
            cliente: f.cliente_nombre,
            status: f.estatus_produccion || 'Pendiente',
            fecha: f.fecha_entrega
        }))
    });
});

// 5. INSIGHTS (Mock de prueba)
exports.getInsights = asyncHandler(async (req, res) => {
    const { question } = req.body;
    console.log("=> 📊 Hit en /insights IA. Pregunta:", question);
    
    res.json({
        ok: true,
        answer: "Analizando los datos de la sucursal: El pastel más vendido esta semana es el de Tres Leches con fresa. Tus ventas han subido un 15% respecto al mes pasado. (Simulación de IA).",
        metrics: {
            ventasTotales: 12500,
            pedidosCompletados: 34
        }
    });
});