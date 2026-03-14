const aiOrderParsingService = require('../../../services/aiOrderParsingService');
const aiDraftService = require('../../../services/aiDraftService'); // IMPORTANTE: Servicio de IA
const orderFlowService = require('../../../services/orderFlowService');
const folioService = require('../folios/folio.service');
const { buildTenantWhere } = require('../../../utils/tenantScope');
const asyncHandler = require('../../core/asyncHandler');
const Folio = require('../../../models/Folio'); // IMPORTANTE: Modelo para actualizar la BD
const { Op, Sequelize } = require('sequelize');

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

    // Mandamos el texto al servicio de IA
    const result = await aiDraftService.processDraft(userMessage);

    if (result.missing && result.missing.length > 0) {
        return res.json({
            isPartial: true,
            message: result.nextQuestion || "Entendí parte del pedido, pero tengo dudas. ¿Me confirmas los datos faltantes?",
            extractedData: result.draft
        });
    }

    const payload = {
        cliente_nombre: result.draft.clientName || 'Cliente Mostrador',
        cliente_telefono: result.draft.clientPhone || '0000000000',
        fecha_entrega: result.draft.deliveryDate || new Date().toISOString(),
        sabores_pan: result.draft.products && result.draft.products.length > 0 ? [result.draft.products[0].flavor] : [],
        descripcion_diseno: result.draft.products && result.draft.products.length > 0 ? result.draft.products[0].design : 'Generado por Asistente IA'
    };

    const draft = await orderFlowService.createDraft(payload, req.user);

    console.log("🚨 DRAFT RAW DEVUELTO POR BD:", JSON.stringify(draft, null, 2));

    const folioId = draft.id || draft.folio_id || draft.folioId || draft;

    res.json({
        ok: true,
        isPartial: false,
        aiConfirmation: `¡Listo! He registrado el pedido para ${payload.cliente_nombre}.`,
        folio: {
            id: folioId,
            cliente_nombre: payload.cliente_nombre,
            cliente_telefono: payload.cliente_telefono,
            fecha_entrega: payload.fecha_entrega,
            total: draft.total || 0,
            ...draft
        },
        folioNumber: draft.folio || `FOLIO-${folioId}`, 
        extractedData: result.draft
    });
});

// 3. EDIT (IA REAL CONECTADA Y ACTUALIZANDO BD)
exports.editOrder = asyncHandler(async (req, res) => {
    const { orderId, editInstruction } = req.body;
    console.log(`=> ✏️ Hit en /edit IA. Orden: ${orderId} | Instrucción: ${editInstruction}`);

    if (!orderId || !editInstruction) {
        return res.status(400).json({ message: 'ID de orden e instrucción son requeridos' });
    }

    // 1. Buscamos la orden real en la BD
    const order = await Folio.findOne({ 
        where: { id: orderId, tenantId: req.user.tenantId } 
    });

    if (!order) {
        return res.status(404).json({ message: 'Pedido no encontrado o no tienes acceso a él.' });
    }

    // 2. Mandamos la orden actual y la instrucción a la IA
    const iaResponse = await aiDraftService.processEdit(order.toJSON(), editInstruction);

    // 3. Aplicamos los cambios que sugirió la IA a la BD
    if (iaResponse.updates && Object.keys(iaResponse.updates).length > 0) {
        await order.update(iaResponse.updates);
    }

    // 4. Respondemos al Frontend con lo que la IA cambió
    res.json({
        ok: true,
        aiConfirmation: iaResponse.summary || `Pedido #${orderId} actualizado correctamente.`,
        changes: iaResponse.updates,
        changedFields: Object.keys(iaResponse.updates || {}),
        order: order
    });
});

// 4. SEARCH (Búsqueda Real con IA Inteligente)
exports.searchOrders = asyncHandler(async (req, res) => {
    const { query } = req.body; 
    const tenantFilter = buildTenantWhere(req);

    console.log("=> 🔍 IA analizando búsqueda:", query);

    if (!query) return res.status(400).json({ message: 'La consulta es requerida' });

    // 1. La IA traduce el texto a filtros estructurados
    const aiSearch = await aiDraftService.processSearch(query);
    const { q, startDate, endDate, status } = aiSearch.filters;

    console.log("🎯 Filtros detectados por IA:", aiSearch.filters);

    // 2. Armamos la consulta dinámica para la BD
    // 2. Armamos la consulta dinámica para la BD
    const whereClause = { ...tenantFilter }; 
    
    // MEJORA: Convertimos los campos JSON a texto (CHAR) para que la búsqueda profunda funcione
    if (q) {
        whereClause[Op.or] = [
            { cliente_nombre: { [Op.like]: `%${q}%` } },
            { descripcion_diseno: { [Op.like]: `%${q}%` } },
            Sequelize.where(Sequelize.cast(Sequelize.col('sabores_pan'), 'CHAR'), { [Op.like]: `%${q}%` }),
            Sequelize.where(Sequelize.cast(Sequelize.col('rellenos'), 'CHAR'), { [Op.like]: `%${q}%` })
        ];
    }
    
    if (startDate && endDate) {
        whereClause.fecha_entrega = { [Op.between]: [startDate, endDate] };
    } else if (startDate) {
        whereClause.fecha_entrega = { [Op.gte]: startDate }; 
    }

    if (status) {
        whereClause.estatus_produccion = status;
    }

    // 3. Hacemos la búsqueda
    const results = await Folio.findAll({
        where: whereClause,
        order: [['fecha_entrega', 'ASC']],
        limit: 20
    });

    // MEJORA 2: Evaluamos si hay resultados para cambiar la respuesta de la IA
    let finalMessage = aiSearch.summary;
    if (results.length === 0) {
        finalMessage = `¡Ups! No encontré ningún pedido que coincida con tu búsqueda.`;
    } else {
        finalMessage = `${aiSearch.summary} (Encontré ${results.length} resultado${results.length > 1 ? 's' : ''})`;
    }

    // 4. Respondemos al Frontend
    res.json({
        ok: true,
        aiSummary: finalMessage,
        count: results.length,
        results: results.map(f => ({
            id: f.id,
            folio: f.folio_numero || `FOLIO-${f.id}`,
            cliente: f.cliente_nombre,
            status: f.estatus_produccion || 'Pendiente',
            fecha: f.fecha_entrega
        })),
        filters: aiSearch.filters
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