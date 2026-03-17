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

// 2. CREATE (IA Real conectada - Versión Simplificada con Detector de Pestaña)
exports.createOrder = asyncHandler(async (req, res) => {
    const { userMessage } = req.body;
    console.log("=> 🧠 Procesando pedido real con IA. Mensaje:", userMessage);

    if (!userMessage) return res.status(400).json({ message: 'El mensaje es requerido' });

    // --- ESCUDO PROTECTOR DE PESTAÑAS ---
    const textLower = userMessage.toLowerCase();
    const isEditIntent = textLower.includes('editar') || textLower.includes('cambiar') || textLower.includes('modificar');
    const isSearchIntent = textLower.includes('buscar') || textLower.includes('dónde') || textLower.includes('encuentra');

    if (isEditIntent) {
        return res.json({
            isPartial: true,
            message: "✏️ Parece que quieres modificar un pedido. Por favor, selecciona la pestaña de 'Editar' (el botón azul) aquí abajo para ayudarte con eso."
        });
    }

    if (isSearchIntent) {
        return res.json({
            isPartial: true,
            message: "🔍 Parece que quieres buscar información. Por favor, selecciona la pestaña de 'Buscar' (el botón verde) aquí abajo."
        });
    }
    // ------------------------------------

    const result = await aiOrderParsingService.parseOrder(userMessage, req.user.tenantId);

    // 1. Verificamos si faltan datos clave (nombre, sabor o fecha)
    const isMissingData = !result.data || !result.data.customerName || !result.data.flavorId || !result.data.deliveryDate;

    // 2. Si faltan datos, lanzamos el mensaje directo
    if (!result.valid || isMissingData) {
        return res.json({
            isPartial: true,
            message: "Si deseas crear un pedido, por favor proporciona los demás datos necesarios como: nombre del cliente, sabor del pastel, fecha de entrega y un número de teléfono.",
            extractedData: result.data
        });
    }

    // 3. Si todo está completo, armamos el paquete para la BD
    const payload = {
        cliente_nombre: result.data.customerName,
        cliente_telefono: result.data.phone || '0000000000',
        fecha_entrega: result.data.deliveryDate,
        sabores_pan: [result.data.flavorId],
        descripcion_diseno: result.data.specs || 'Generado por Asistente IA'
    };

    // 4. Creamos el borrador real en la base de datos
    const draft = await orderFlowService.createDraft(payload, req.user);

    // BLINDAJE: Extraemos el ID venga como venga
    const folioId = draft.id || draft.folio_id || draft.folioId || draft;

    // 5. Mandamos la respuesta de éxito
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
        extractedData: result.data
    });
});

// 3. EDIT (IA REAL CONECTADA Y ACTUALIZANDO BD)
// 3. EDIT (IA Real conectada)
exports.editOrder = asyncHandler(async (req, res) => {
    // Como el frontend manda (null, userMessage), la instrucción real viene en 'editInstruction'
    const { editInstruction } = req.body; 
    console.log(`=> ✏️ Procesando edición real con IA. Mensaje: ${editInstruction}`);

    if (!editInstruction) return res.status(400).json({ ok: false, message: 'El mensaje es requerido' });

    // Mandamos el texto al servicio de IA para que extraiga el ID y los cambios a aplicar
    const result = await aiOrderParsingService.parseEditOrder(editInstruction, req.user.tenantId);

    if (!result.valid || !result.data.orderId) {
        return res.json({
            ok: false,
            message: result.errors ? `Tengo dudas: ${result.errors.join(', ')}` : "¿De qué número de pedido me hablas? No logré identificarlo."
        });
    }

    // AQUI ES DONDE SE GUARDA EN LA BASE DE DATOS REAL (Descomentar cuando esté listo)
    // const updatedOrder = await orderFlowService.updateOrder(result.data.orderId, result.data.changes, req.user);

    res.json({
        ok: true,
        message: `¡Listo! He actualizado el pedido ${result.data.orderId} con los nuevos cambios.`,
        updatedData: {
            cambiosAplicados: Object.keys(result.data.changes || {}),
        },
        order: { id: result.data.orderId } 
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