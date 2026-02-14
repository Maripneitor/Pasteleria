const aiOrderParsingService = require('../services/aiOrderParsingService');
const orderFlowService = require('../services/orderFlowService');
const { AISession, Folio, Client } = require('../models');
const { OpenAI } = require('openai');
const { Op } = require('sequelize');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

// ===================================================================
// FUNCIÓN EXISTENTE: parseOrder (mantener sin cambios)
// ===================================================================
exports.parseOrder = async (req, res) => {
    try {
        const { text, sessionId } = req.body;
        if (!text) return res.status(400).json({ message: 'Text is required' });

        // 1. Parse with AI
        const result = await aiOrderParsingService.parseOrder(text, req.user.tenantId);
        const aiData = result.data;

        // 2. Find or Create Session (Persistence)
        let session = null;
        if (sessionId) {
            session = await AISession.findByPk(sessionId);
        }

        if (!session) {
            // Create new session if none exists
            session = await AISession.create({
                userId: req.user.id,
                tenantId: req.user.tenantId,
                status: 'active',
                whatsappConversation: JSON.stringify([{ role: 'user', content: text }])
            });
        } else {
            // Append to existing conversation
            const hist = JSON.parse(session.whatsappConversation || '[]');
            hist.push({ role: 'user', content: text });
            session.whatsappConversation = JSON.stringify(hist);
        }

        // 3. Update Session Data
        const currentData = session.extractedData || {};
        const newData = {
            cliente_nombre: aiData.customerName || currentData.cliente_nombre,
            cliente_telefono: aiData.phone || currentData.cliente_telefono,
            fecha_entrega: aiData.deliveryDate || currentData.fecha_entrega,
            sabores_pan: aiData.flavorId ? [aiData.flavorId] : (currentData.sabores_pan || []),
            rellenos: aiData.fillingId ? [aiData.fillingId] : (currentData.rellenos || []),
            descripcion_diseno: aiData.specs || currentData.descripcion_diseno
        };

        session.extractedData = newData;

        // Save assistant response
        if (aiData.assistant_response) {
            const hist = JSON.parse(session.whatsappConversation || '[]');
            hist.push({ role: 'assistant', content: aiData.assistant_response });
            session.whatsappConversation = JSON.stringify(hist);
        }

        await session.save();

        // 4. Return response (Success even if incomplete)
        res.json({
            valid: result.valid,
            assistant_response: aiData.assistant_response,
            draft: newData,
            sessionId: session.id,
            missing: aiData.missing_fields || []
        });

    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'AI Parsing Failed', error: e.message });
    }
};

// ===================================================================
// NUEVA FUNCIÓN 1: createOrderWithAI - Crear pedido completo con IA
// ===================================================================
exports.createOrderWithAI = async (req, res) => {
    try {
        const { userMessage } = req.body;
        if (!userMessage) return res.status(400).json({ message: 'userMessage is required' });

        // 1. Parse order data con IA
        const parseResult = await aiOrderParsingService.parseOrder(userMessage, req.user.tenantId);

        if (!parseResult.valid) {
            return res.status(400).json({
                success: false,
                message: 'No pude extraer la información del pedido',
                errors: parseResult.errors
            });
        }

        const aiData = parseResult.data;

        // 2. Validar datos mínimos para crear pedido
        if (!aiData.customerName || !aiData.phone) {
            return res.status(400).json({
                success: false,
                message: 'Necesito al menos el nombre del cliente y teléfono para crear el pedido',
                extractedData: aiData,
                missing: aiData.missing_info || ['Nombre', 'Teléfono']
            });
        }

        // 3. Buscar o crear cliente
        let client = await Client.findOne({
            where: {
                phone: aiData.phone,
                tenantId: req.user.tenantId
            }
        });

        if (!client) {
            client = await Client.create({
                name: aiData.customerName,
                phone: aiData.phone,
                tenantId: req.user.tenantId
            });
        }

        //4. Crear Folio
        const folioData = {
            clientId: client.id,
            cliente_nombre: client.name,
            cliente_telefono: client.phone,
            tenantId: req.user.tenantId,
            responsibleUserId: req.user.id,

            // Información del pedido
            fecha_entrega: aiData.deliveryDate || null,
            hora_entrega: '12:00', // Default
            sabores_pan: aiData.flavorId ? JSON.stringify([aiData.flavorId]) : JSON.stringify([]),
            rellenos: aiData.fillingId ? JSON.stringify([aiData.fillingId]) : JSON.stringify([]),
            descripcion_diseno: aiData.specs || '',

            // Económicos
            total: 500, // Default placeholder
            anticipo: 0,
            status: 'pendiente'
        };

        const folio = await Folio.create(folioData);

        // 5. Generar número de folio (formato: MesInicial DíaInicial-Día-Tel)
        const folioNumber = await generateFolioNumber(folio);
        await folio.update({ folioNumber });

        // 6. Generar mensaje de confirmación con IA
        const confirmationPrompt = `Resume este pedido de forma amigable para confirmar:
        
Folio: ${folioNumber}
Cliente: ${client.name}
Teléfono: ${client.phone}
Fecha entrega: ${aiData.deliveryDate || 'Pendiente'}
Sabor: ${aiData.flavorId ? 'ID ' + aiData.flavorId : 'Pendiente'}
Especificaciones: ${aiData.specs || 'Ninguna'}

Usa un tono profesional pero cercano. Confirma el registro y menciona que pueden pagar anticipo.`;

        const confirmation = await openai.chat.completions.create({
            model: MODEL,
            messages: [{ role: 'user', content: confirmationPrompt }],
            max_tokens: 300,
            temperature: 0.7
        });

        res.status(201).json({
            success: true,
            message: 'Pedido creado exitosamente',
            folio: await Folio.findByPk(folio.id, { include: ['client'] }),
            folioNumber,
            aiConfirmation: confirmation.choices[0].message.content,
            extractedData: aiData
        });

    } catch (error) {
        console.error('Error en createOrderWithAI:', error);
        res.status(500).json({
            success: false,
            message: 'Error al crear pedido con IA',
            error: error.message
        });
    }
};

// === FUNCIÓN 2: editOrderWithAI - Editar pedido con instrucciones IA
exports.editOrderWithAI = async (req, res) => {
    try {
        const { orderId, editInstruction } = req.body;

        if (!orderId || !editInstruction) {
            return res.status(400).json({ message: 'orderId y editInstruction son requeridos' });
        }

        // 1. Obtener pedido
        const order = await Folio.findByPk(orderId, { include: ['client'] });
        if (!order) {
            return res.status(404).json({ message: 'Pedido no encontrado' });
        }

        // 2. Crear contexto de pedido actual
        const currentData = {
            folioNumber: order.folioNumber,
            cliente: order.cliente_nombre,
            telefono: order.cliente_telefono,
            fechaEntrega: order.fecha_entrega,
            horaEntrega: order.hora_entrega,
            sabores: order.sabores_pan ? JSON.parse(order.sabores_pan) : [],
            rellenos: order.rellenos ? JSON.parse(order.rellenos) : [],
            descripcion: order.descripcion_diseno,
            total: order.total
        };

        // 3. IA interpreta qué cambiar
        const editPrompt = `
Pedido actual:
${JSON.stringify(currentData, null, 2)}

Instrucción de cambio:
"${editInstruction}"

Genera JSON con SOLO los campos que deben cambiar:
{
  "fecha_entrega": "YYYY-MM-DD si cambia",
  "hora_entrega": "HH:MM si cambia",
  "descripcion_diseno": "nueva descripción si cambia",
  "total": número si cambia,
  "needsClarification": boolean si no está claro
}

Solo incluye campos que cambien. Si no está claro, pon needsClarification: true`;

        const aiResponse = await openai.chat.completions.create({
            model: MODEL,
            messages: [{ role: 'user', content: editPrompt }],
            response_format: { type: 'json_object' },
            temperature: 0
        });

        const changes = JSON.parse(aiResponse.choices[0].message.content);

        if (changes.needsClarification) {
            return res.status(400).json({
                success: false,
                message: 'Necesito más detalles. ¿Qué exactamente quieres cambiar?',
                currentOrder: currentData
            });
        }

        // 4. Aplicar cambios
        const updateData = {};
        if (changes.fecha_entrega) updateData.fecha_entrega = changes.fecha_entrega;
        if (changes.hora_entrega) updateData.hora_entrega = changes.hora_entrega;
        if (changes.descripcion_diseno) updateData.descripcion_diseno = changes.descripcion_diseno;
        if (changes.total) updateData.total = changes.total;

        await order.update(updateData);

        // 5. Confirmar cambios
        const confirmPrompt = `Resume los cambios para el pedido ${order.folioNumber}:
Cambios: ${JSON.stringify(changes, null, 2)}
Usa tono confirmatorio y profesional.`;

        const confirmation = await openai.chat.completions.create({
            model: MODEL,
            messages: [{ role: 'user', content: confirmPrompt }],
            max_tokens: 200
        });

        res.json({
            success: true,
            message: 'Pedido actualizado',
            order: await Folio.findByPk(orderId, { include: ['client'] }),
            changes,
            aiConfirmation: confirmation.choices[0].message.content
        });

    } catch (error) {
        console.error('Error en editOrderWithAI:', error);
        res.status(500).json({ success: false, message: 'Error al editar pedido', error: error.message });
    }
};

// === FUNCIÓN 3: searchOrdersWithAI - Búsqueda en lenguaje natural
exports.searchOrdersWithAI = async (req, res) => {
    try {
        const { query } = req.body;
        if (!query) return res.status(400).json({ message: 'query es requerido' });

        const tenantId = req.user.tenantId;

        // 1. IA convierte búsqueda a filtros
        const searchPrompt = `
Convierte esta búsqueda a filtros de base de datos:
"${query}"

Responde SOLO JSON:
{
  "filters": {
    "deliveryDateFrom": "YYYY-MM-DD o null",
    "deliveryDateTo": "YYYY-MM-DD o null",
    "clientName": "nombre parcial o null",
    "folioNumber": "folio o null",
    "status": "pendiente|confirmado|entregado o null",
    "minPrice": número o null,
    "maxPrice": número o null
  },
  "sortBy": "fecha_entrega|createdAt|total",
  "sortOrder": "ASC|DESC"
}

Fecha actual: ${new Date().toISOString().split('T')[0]}
Ejemplos:
- "pedidos de esta semana" → deliveryDateFrom: hoy, deliveryDateTo: +7 días
- "pedidos de Juan" → clientName: "Juan"
- "folios mayores a 1000" → minPrice: 1000`;

        const aiResponse = await openai.chat.completions.create({
            model: MODEL,
            messages: [{ role: 'user', content: searchPrompt }],
            response_format: { type: 'json_object' },
            temperature: 0
        });

        const searchCriteria = JSON.parse(aiResponse.choices[0].message.content);
        const filters = searchCriteria.filters;

        // 2. Construir query Sequelize
        const where = { tenantId };

        if (filters.deliveryDateFrom || filters.deliveryDateTo) {
            where.fecha_entrega = {};
            if (filters.deliveryDateFrom) where.fecha_entrega[Op.gte] = filters.deliveryDateFrom;
            if (filters.deliveryDateTo) where.fecha_entrega[Op.lte] = filters.deliveryDateTo;
        }

        if (filters.status) where.status = filters.status;
        if (filters.minPrice) where.total = { [Op.gte]: filters.minPrice };
        if (filters.maxPrice) where.total = { ...where.total, [Op.lte]: filters.maxPrice };
        if (filters.folioNumber) where.folioNumber = { [Op.like]: `%${filters.folioNumber}%` };

        const clientWhere = {};
        if (filters.clientName) {
            clientWhere.name = { [Op.like]: `%${filters.clientName}%` };
        }

        // 3. Ejecutar búsqueda
        const orders = await Folio.findAll({
            where,
            include: [
                {
                    model: Client,
                    as: 'client',
                    where: Object.keys(clientWhere).length > 0 ? clientWhere : undefined,
                    required: Object.keys(clientWhere).length > 0
                }
            ],
            order: [[searchCriteria.sortBy || 'fecha_entrega', searchCriteria.sortOrder || 'ASC']],
            limit: 50
        });

        // 4. Resumen con IA
        const summaryPrompt = `
Encontré ${orders.length} pedidos para: "${query}"
${orders.length > 0 ? `Total aproximado: $${orders.reduce((sum, o) => sum + parseFloat(o.total || 0), 0)}` : ''}

Resume los resultados de forma clara (máximo 3 líneas).`;

        const summary = await openai.chat.completions.create({
            model: MODEL,
            messages: [{ role: 'user', content: summaryPrompt }],
            max_tokens: 150
        });

        res.json({
            success: true,
            query,
            filters,
            results: orders,
            count: orders.length,
            aiSummary: summary.choices[0].message.content
        });

    } catch (error) {
        console.error('Error en searchOrdersWithAI:', error);
        res.status(500).json({ success: false, message: 'Error al buscar', error: error.message });
    }
};

// === FUNCIÓN 4: getDashboardInsights - Análisis de métricas
exports.getDashboardInsights = async (req, res) => {
    try {
        const { question } = req.body;
        if (!question) return res.status(400).json({ message: 'question es requerida' });

        const tenantId = req.user.tenantId;
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

        // 1. Obtener métricas
        const [totalOrders, monthOrders, pendingOrders, totalRevenue, monthRevenue] = await Promise.all([
            Folio.count({ where: { tenantId } }),
            Folio.count({ where: { tenantId, createdAt: { [Op.gte]: startOfMonth } } }),
            Folio.count({ where: { tenantId, status: 'pendiente' } }),
            Folio.sum('total', { where: { tenantId } }),
            Folio.sum('total', { where: { tenantId, createdAt: { [Op.gte]: startOfMonth } } })
        ]);

        // 2. IA analiza
        const insightPrompt = `
Datos del dashboard de pastelería:

- Total pedidos históricos: ${totalOrders}
- Pedidos este mes: ${monthOrders}
- Pedidos pendientes: ${pendingOrders}
- Ingresos totales: $${totalRevenue || 0}
- Ingresos este mes: $${monthRevenue || 0}

Pregunta: "${question}"

Responde de forma analítica pero accesible. Usa números y porcentajes. Máximo 3 párrafos.`;

        const aiResponse = await openai.chat.completions.create({
            model: MODEL,
            messages: [{ role: 'user', content: insightPrompt }],
            max_tokens: 500
        });

        res.json({
            success: true,
            question,
            dashboardData: { totalOrders, monthOrders, pendingOrders, totalRevenue, monthRevenue },
            insight: aiResponse.choices[0].message.content
        });

    } catch (error) {
        console.error('Error en getDashboardInsights:', error);
        res.status(500).json({ success: false, message: 'Error al obtener insights', error: error.message });
    }
};

// === FUNCIÓN AUXILIAR: Generar Número de Folio
async function generateFolioNumber(folio) {
    const deliveryDate = new Date(folio.fecha_entrega || new Date());

    const meses = ['E', 'F', 'M', 'A', 'M', 'J', 'Jl', 'Ag', 'S', 'O', 'N', 'D'];
    const dias = ['D', 'L', 'M', 'Mi', 'J', 'V', 'S'];

    const inicialMes = meses[deliveryDate.getMonth()];
    const inicialDia = dias[deliveryDate.getDay()];
    const diaNumero = deliveryDate.getDate();

    // Últimos 4 dígitos del teléfono
    const client = await folio.getClient();
    const phone = (client.phone || '0000').toString();
    const ultimos4 = phone.slice(-4);

    let folioBase = `${inicialMes}${inicialDia}-${diaNumero}-${ultimos4}`;

    // Verificar duplicados
    const existing = await Folio.findOne({
        where: {
            folioNumber: { [Op.like]: `${folioBase}%` },
            tenantId: folio.tenantId
        },
        order: [['id', 'DESC']]
    });

    if (existing) {
        const match = existing.folioNumber.match(/-(\d+)$/);
        const counter = match ? parseInt(match[1]) + 1 : 1;
        folioBase = `${folioBase}-${counter}`;
    }

    return folioBase;
}
