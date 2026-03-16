const aiOrderParsingService = require('../../../services/aiOrderParsingService');
const aiDraftService = require('../../../services/aiDraftService'); 
const orderFlowService = require('../../../services/orderFlowService');
const folioService = require('../folios/folio.service');
const { buildTenantWhere } = require('../../../utils/tenantScope');
const asyncHandler = require('../../core/asyncHandler');
const Folio = require('../../../models/Folio'); 

// ✅ NUEVO: Importamos los modelos CORRECTOS según tu catalog.controller.js
const CakeFlavor = require('../../../models/CakeFlavor'); 
const Filling = require('../../../models/Filling'); 

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

// 2. CREATE (IA Real conectada, Protegida y con Catálogo)
exports.createOrder = asyncHandler(async (req, res) => {
    const { userMessage } = req.body;
    console.log("=> 🧠 Procesando pedido real con IA. Mensaje:", userMessage);

    if (!userMessage) return res.status(400).json({ message: 'El mensaje es requerido' });

    // ✅ CORRECCIÓN: Consultamos las tablas correctas (cake_flavors y fillings)
    const saboresDB = await CakeFlavor.findAll({
        where: { tenantId: req.user.tenantId, isActive: true },
        attributes: ['name']
    });
    
    const rellenosDB = await Filling.findAll({
        where: { tenantId: req.user.tenantId, isActive: true },
        attributes: ['name']
    });

    const saboresDisponibles = saboresDB.map(s => s.name);
    const rellenosDisponibles = rellenosDB.map(r => r.name);

    console.log("🛑 DEBUG BD - Sabores Reales:", saboresDisponibles);
    console.log("🛑 DEBUG BD - Rellenos Reales:", rellenosDisponibles);

    // 1. Mandamos el texto al servicio de IA y le pasamos los catálogos reales!
    const result = await aiDraftService.processDraft(userMessage, saboresDisponibles, rellenosDisponibles);

    // 🛡️ REGLA DE SEGURIDAD
    if (result.isOrderIntent === false) {
        return res.json({
            isPartial: true,
            message: "✋ Parece que quieres buscar o editar un pedido, pero estás en la pestaña de 'Crear'. Por favor, selecciona la pestaña de Buscar (Lupa) o Editar (Lápiz).",
            extractedData: null
        });
    }

    // 🛡️ REGLA DE INVENTARIO
    if (result.valid === false) {
        return res.json({
            isPartial: true,
            message: result.aiResponse || "El sabor o relleno solicitado no está en nuestro menú actual.",
            extractedData: result.draft || null
        });
    }

    // 2. Validamos si faltan datos
    if (result.missing && result.missing.length > 0) {
        return res.json({
            isPartial: true,
            message: result.nextQuestion || "Tengo una duda con tu pedido. ¿Me confirmas?",
            extractedData: result.draft
        });
    }

    // 3. Armamos el paquete para la BD
    const payload = {
        cliente_nombre: result.draft.clientName || 'Cliente Mostrador',
        cliente_telefono: result.draft.clientPhone || '0000000000',
        fecha_entrega: result.draft.deliveryDate || new Date().toISOString(),
        sabores_pan: result.draft.products && result.draft.products[0].flavor ? [result.draft.products[0].flavor] : [],
        rellenos: result.draft.products && result.draft.products[0].filling ? [result.draft.products[0].filling] : [],
        descripcion_diseno: result.draft.products && result.draft.products[0].design ? result.draft.products[0].design : 'Generado por Asistente IA'
    };

    // 4. Creamos el borrador real
    const draft = await orderFlowService.createDraft(payload, req.user);
    const folioId = draft.id || draft.folio_id || draft.folioId || draft;

    // 5. Mandamos la respuesta al frontend
    res.json({
        ok: true,
        isPartial: false,
        aiConfirmation: result.aiResponse || `¡Listo! He registrado el pedido para ${payload.cliente_nombre}.`,
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

    const order = await Folio.findOne({ 
        where: { id: orderId, tenantId: req.user.tenantId } 
    });

    if (!order) {
        return res.status(404).json({ message: 'Pedido no encontrado o no tienes acceso a él.' });
    }

    // ✅ CORRECCIÓN: Consultamos las tablas correctas para la edición
    const saboresDB = await CakeFlavor.findAll({
        where: { tenantId: req.user.tenantId, isActive: true },
        attributes: ['name']
    });
    
    const rellenosDB = await Filling.findAll({
        where: { tenantId: req.user.tenantId, isActive: true },
        attributes: ['name']
    });

    const saboresDisponibles = saboresDB.map(s => s.name);
    const rellenosDisponibles = rellenosDB.map(r => r.name);

    const iaResponse = await aiDraftService.processEdit(order.toJSON(), editInstruction, saboresDisponibles, rellenosDisponibles);

    // 🛡️ REGLA DE INVENTARIO PARA EDICIÓN
    if (iaResponse.valid === false) {
        return res.json({
            ok: false,
            aiConfirmation: iaResponse.aiResponse || "El sabor o relleno solicitado no está en nuestro catálogo.",
            changes: null,
            changedFields: [],
            order: order
        });
    }

    if (iaResponse.updates && Object.keys(iaResponse.updates).length > 0) {
        await order.update(iaResponse.updates);
    }

    res.json({
        ok: true,
        aiConfirmation: iaResponse.summary || iaResponse.aiResponse || `Pedido #${orderId} actualizado correctamente.`,
        changes: iaResponse.updates,
        changedFields: Object.keys(iaResponse.updates || {}),
        order: order
    });
});

// 4. SEARCH
exports.searchOrders = asyncHandler(async (req, res) => {
    const { query } = req.body; 
    const tenantFilter = buildTenantWhere(req);

    if (!query) return res.status(400).json({ message: 'La consulta es requerida' });

    const aiSearch = await aiDraftService.processSearch(query);
    const { q, startDate, endDate, status } = aiSearch.filters;

    const whereClause = { ...tenantFilter }; 
    
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

    const results = await Folio.findAll({
        where: whereClause,
        order: [['fecha_entrega', 'ASC']],
        limit: 20
    });

    let finalMessage = aiSearch.summary;
    if (results.length === 0) {
        finalMessage = `¡Ups! No encontré ningún pedido que coincida con tu búsqueda.`;
    } else {
        finalMessage = `${aiSearch.summary} (Encontré ${results.length} resultado${results.length > 1 ? 's' : ''})`;
    }

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

// 5. INSIGHTS (Análisis Real con IA)
exports.getInsights = asyncHandler(async (req, res) => {
    const { question } = req.body;
    console.log("=> 📊 IA Analizando Datos. Pregunta:", question);
    
    if (!question) return res.status(400).json({ message: 'La pregunta es requerida' });

    // 1. Obtenemos la fecha de hace 30 días para no saturar a la IA con años de datos
    const haceUnMes = new Date();
    haceUnMes.setDate(haceUnMes.getDate() - 30);

    // 2. Traemos todos los pedidos reales de esta sucursal del último mes
    const pedidos = await Folio.findAll({
        where: {
            tenantId: req.user.tenantId,
            fecha_entrega: { [Op.gte]: haceUnMes }
        },
        // Solo sacamos las columnas que le sirven a la IA para analizar
        attributes: ['id', 'cliente_nombre', 'total', 'sabores_pan', 'rellenos', 'estatus_produccion', 'fecha_entrega'],
        raw: true // Trae datos puros de JS
    });

    // 3. Calculamos un par de métricas rápidas de ayuda
    const ventasTotales = pedidos.reduce((sum, p) => sum + (Number(p.total) || 0), 0);
    const pedidosCompletados = pedidos.filter(p => p.estatus_produccion === 'Entregado').length;

    const dbStats = {
        periodo: "Últimos 30 días",
        totalPedidos: pedidos.length,
        ventasTotales,
        pedidosCompletados,
        detallePedidos: pedidos // Pasamos la lista completa a la IA
    };

    console.log(`🛑 DEBUG INSIGHTS: Se enviaron ${pedidos.length} pedidos a OpenAI para analizar.`);

    // 4. Mandamos los datos y la pregunta a OpenAI
    const iaResponse = await aiDraftService.processInsights(question, dbStats);

    // 5. Respondemos al Frontend
    res.json({
        ok: true,
        answer: iaResponse.answer,
        aiConfirmation: iaResponse.answer, 
        aiSummary: iaResponse.answer,
        metrics: {
            ventasTotales,
            pedidosCompletados,
            totalPedidos: pedidos.length // 👈 ¡AGREGA ESTA LÍNEA!
        }
    });
});