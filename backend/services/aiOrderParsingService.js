const { OpenAI } = require('openai');
const { CakeFlavor, Filling } = require('../models');
const { Op } = require('sequelize');

// Setup OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || 'mock-key',
});

const MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

class AiOrderParsingService {

    /**
     * Parse text into structured order with IDs
     * @param {string} text 
     * @param {number} tenantId 
     * @returns {Object} { valid: boolean, data: Object, errors: string[] }
     */
    async parseOrder(text, tenantId) {
        // 1. Fetch RAG Context (Catalogs)
        const flavors = await CakeFlavor.findAll({
            where: { tenantId },
            attributes: ['id', 'name']
        });
        const fillings = await Filling.findAll({
            where: { tenantId },
            attributes: ['id', 'name']
        });

        const catalogContext = {
            flavors: flavors.map(f => ({ id: f.id, name: f.name })),
            fillings: fillings.map(f => ({ id: f.id, name: f.name }))
        };

        // 2. Call AI
        // We separate this method for easier mocking
        const aiResponse = await this._callOpenAI(text, catalogContext);

        // 3. Deterministic Validation
        const validation = this._validateIds(aiResponse, catalogContext);

        if (!validation.valid) {
            return { valid: false, errors: validation.errors };
        }

        return { valid: true, data: aiResponse };
    }

    /**
     * Parse text to extract Order ID and the requested changes
     * @param {string} text 
     * @param {number} tenantId 
     * @returns {Object} { valid: boolean, data: Object, errors: string[] }
     */
    async parseEditOrder(text, tenantId) {
        // En QA Mode devolvemos un mock rápido
        if (process.env.QA_MODE === '1') {
            return {
                valid: true,
                data: { orderId: 26, changes: { cantidad: 2 } },
                errors: []
            };
        }

        if (!process.env.OPENAI_API_KEY) {
            console.warn("⚠️ No OpenAI API Key.");
            throw new Error("OpenAI Config Missing");
        }

        const systemPrompt = `
You are an AI assistant for a bakery. Your task is to understand instructions to EDIT existing orders.
The user will provide a natural language sentence asking to modify an order.
You must accurately extract the EXACT Order ID (Folio ID) they refer to, and the specific fields they want to change.

CRITICAL INSTRUCTIONS:
1. Identify the Order ID (a number). Read carefully. The user might mention quantities before the Order ID (e.g., "Change the quantity to 2 in order 26" -> orderId is 26, cantidad is 2).
2. Identify the fields to change. Map them to these possible keys: "fecha_entrega" (YYYY-MM-DD), "cantidad" (number), "sabor_pan" (string), "detalles" (string), "estatus" (string).
3. If you cannot find a clear Order ID, return null for orderId.
4. Output JSON only.

Schema:
{
  "orderId": number or null,
  "changes": {
    // ONLY include the keys the user explicitly wants to change
  },
  "errors": [] // Array of strings if there is ambiguity
}
`;

        const completion = await openai.chat.completions.create({
            model: MODEL,
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: text }
            ],
            response_format: { type: "json_object" },
            temperature: 0
        });

        const aiResponse = JSON.parse(completion.choices[0].message.content);

        return {
            valid: aiResponse.orderId !== null && (!aiResponse.errors || aiResponse.errors.length === 0),
            data: aiResponse,
            errors: aiResponse.errors || []
        };
    }

    /**
     * Internal method to call OpenAI - Monkey patch this for QA
     */
    async _callOpenAI(text, context) {
        // QA Mode Mock
        if (process.env.QA_MODE === '1') {
            const fId = context.flavors.length > 0 ? context.flavors[0].id : null;
            const filId = context.fillings.length > 0 ? context.fillings[0].id : null;
            return {
                customerName: "QA Mock User",
                phone: "5555555555",
                deliveryDate: new Date().toISOString().split('T')[0],
                flavorId: fId,
                fillingId: filId,
                specs: "QA Mock Specs (Determinism)",
                errors: []
            };
        }

        if (!process.env.OPENAI_API_KEY) {
            console.warn("⚠️ No OpenAI API Key. In production this fails. In QA we mock this.");
            throw new Error("OpenAI Config Missing");
        }

        const systemPrompt = `
You are an order parser for a bakery.
Context:
Flavors: ${JSON.stringify(context.flavors)}
Fillings: ${JSON.stringify(context.fillings)}

Current Date (Mexico City): ${new Date().toLocaleString("es-MX", { timeZone: "America/Mexico_City" })}

Instructions:
1. Extract customer name, phone, date (ISO 8601), flavorId, fillingId.
2. Map text to the closest ID from the context.
3. If a flavor/filling is requested but not in the list, return null for that ID and add an error string.
4. Output JSON only.

Schema:
{
  "customerName": string,
  "phone": string,
  "deliveryDate": string (YYYY-MM-DD) or null,
  "flavorId": number or null,
  "fillingId": number or null,
  "specs": string,
  "errors": string[] (items not found)
}
`;

        const completion = await openai.chat.completions.create({
            model: MODEL,
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: text }
            ],
            response_format: { type: "json_object" },
            temperature: 0
        });

        return JSON.parse(completion.choices[0].message.content);
    }

    _validateIds(data, context) {
        const errors = [];
        if (data.errors && data.errors.length > 0) {
            errors.push(...data.errors);
        }

        // Validate Flavor
        if (data.flavorId) {
            const exists = context.flavors.find(f => f.id === data.flavorId);
            if (!exists) errors.push(`Flavor ID ${data.flavorId} does not exist in tenant.`);
        }

        // Validate Filling
        if (data.fillingId) {
            const exists = context.fillings.find(f => f.id === data.fillingId);
            if (!exists) errors.push(`Filling ID ${data.fillingId} does not exist in tenant.`);
        }

        return { valid: errors.length === 0, errors };
    }

    /**
     * =========================================================
     * NUEVO: Genera una respuesta conversacional para WhatsApp 
     * validando estrictamente contra el catálogo de la sucursal.
     * =========================================================
     */
    async generateWhatsAppReply(chatHistory, tenantId) {
        if (!process.env.OPENAI_API_KEY) throw new Error("OpenAI Config Missing");

        // 1. Traer catálogos reales de la base de datos
        const flavors = await CakeFlavor.findAll({ where: { tenantId }, attributes: ['name'] });
        const fillings = await Filling.findAll({ where: { tenantId }, attributes: ['name'] });

        const catalogContext = {
            flavors: flavors.map(f => f.name).join(', '),
            fillings: fillings.map(f => f.name).join(', ')
        };

        // 2. Prompt estricto para conversación interactiva (CON MENÚ DE OPCIONES Y PREGUNTAS PASO A PASO)
        const systemPrompt = `Eres el asistente experto de ventas y atención a clientes de "Pastelería La Fiesta".
Tu objetivo es atender por WhatsApp de forma amable, conversacional y muy paciente.

INFORMACIÓN GENERAL DE LA PASTELERÍA:
- Horarios: Lunes a Sábado de 9:00 AM a 8:00 PM.
- Ubicación: Tuxtla Gutiérrez, Chiapas. (Ofrecemos servicio a domicilio o recoger en sucursal).
Catálogo de Sabores de Pan: ${catalogContext.flavors || 'Vainilla, Chocolate'}
Catálogo de Rellenos: ${catalogContext.fillings || 'Fresa, Cajeta, Chocolate'}
Fecha actual: ${new Date().toLocaleString("es-MX", { timeZone: "America/Mexico_City" })}

REGLA 1 (EL MENÚ DE INICIO):
Si el usuario te saluda por primera vez o pide ayuda general, preséntate amablemente y muéstrale este menú:
1️⃣ Hacer un nuevo pedido de pastel.
2️⃣ Ver detalles de un pedido existente.
3️⃣ Información del local.
*Nota:* Si el cliente inicia diciendo "Quiero hacer un pedido", omite el menú y pasa directo a la REGLA 2.

REGLA 2 (RECOPILACIÓN PASO A PASO - MUY IMPORTANTE):
Para hacer un pedido, DEBES preguntar los datos ESTRICTAMENTE UNO POR UNO. Espera la respuesta del cliente antes de hacer la siguiente pregunta. NUNCA juntes dos o más preguntas en un solo mensaje.
Sigue este orden exacto:
1. Nombre completo.
2. Fecha de entrega.
3. Para cuántas personas (tamaño).
4. Sabor del pan (menciona los disponibles).
5. Sabor del relleno (menciona los disponibles).
6. Diseño o temática (aclara amablemente que es opcional).
7. Dedicatoria escrita (aclara amablemente que es opcional).
8. Tipo de entrega: ¿Recoger en sucursal o envío a domicilio? (Si elige domicilio, en ese mismo momento pide calle y colonia).

REGLA 3 (LA CONFIRMACIÓN ESTRICTA):
Esta regla es VITAL y se divide en dos pasos obligatorios:
- PASO A: Cuando ya tengas TODOS los 8 datos de la Regla 2, hazle un resumen completo usando emojis y este formato exacto:
👤 *Nombre:* [Nombre]
📅 *Fecha de entrega:* [Fecha]
🍰 *Tamaño:* [Personas]
🍞 *Sabor de pan:* [Sabor]
🍓 *Sabor de relleno:* [Sabor]
🎨 *Diseño:* [Diseño]
✍️ *Dedicatoria:* [Texto]
📍 *Tipo de entrega:* [Entrega]

Pregúntale: "¿Todo está correcto y estás de acuerdo con el pedido para generar tu folio? 😊". DETENTE AQUÍ. NO uses ninguna etiqueta todavía. Espera a que el cliente responda.
- PASO B: SI Y SÓLO SI el cliente ya respondió con un "Sí", "Correcto" o "Está bien" a tu resumen, ENTONCES tu respuesta debe incluir EXACTAMENTE esta etiqueta y una breve despedida: [CREAR_FOLIO_AHORA]

REGLA 4 (FLUJO: CONSULTAR PEDIDO):
Si el cliente elige la opción 2, pídele su número de Folio.
Cuando te lo dé, respóndele que buscarás su información y DEBES agregar exactamente esta etiqueta al final de tu respuesta: [BUSCAR_FOLIO:numero_del_folio]. 
Ejemplo exacto: [BUSCAR_FOLIO:15]

REGLA 5 (ENFOQUE PROFESIONAL):
Ignora bromas o temas que no tengan que ver con la pastelería. Dirige siempre la plática hacia nuestros postres.`;

        // 3. Llamar a OpenAI pasando todo el historial del chat
        const completion = await openai.chat.completions.create({
            model: MODEL,
            messages: [
                { role: "system", content: systemPrompt },
                ...chatHistory // Historial de la plática previa ({role: 'user'/'assistant', content: '...'})
            ],
            temperature: 0.3 // Temperatura baja para evitar alucinaciones de sabores inventados
        });

        return completion.choices[0].message.content;
    }
}

module.exports = new AiOrderParsingService();