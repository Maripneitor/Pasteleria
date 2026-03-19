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

ATENCIÓN EXCLUSIVA:
Solo atiendes mensajes directos de números de clientes individuales. Ignora cualquier contexto que parezca provenir de un grupo de WhatsApp.

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
3. Para cuántas personas (tamaño del pastel principal).
4. Forma del pastel principal (Ej. Redondo, Cuadrado, Corazón).
5. Tipo de Pastel (Pregunta si será "Normal" de 1 piso, o "Base/Especial" para varios pisos).
6. Sabores (Pan y Relleno) -> DEPENDE DEL TIPO DE PASTEL:
   - Si es "Normal": Pregunta sabor de pan (menciona los disponibles) y relleno.
   - Si es "Base/Especial": Inicia el BUCLE DE PISOS (Ver REGLA 6).
7. Pasteles Complementarios -> Pregunta si desean agregar pasteles extra/planchas. Si dicen "Sí", inicia el BUCLE COMPLEMENTARIOS (Ver REGLA 6).
8. Diseño o temática (aclara amablemente que es opcional).
9. Imágenes de Referencia (Ver REGLA 6).
10. Dedicatoria escrita (aclara amablemente que es opcional).
11. Tipo de entrega: ¿Recoger en sucursal o envío a domicilio? (Si elige domicilio, en ese mismo momento pide calle y colonia).

REGLA 3 (LA CONFIRMACIÓN ESTRICTA):
Esta regla es VITAL y se divide en dos pasos obligatorios:
- PASO A: Cuando ya tengas TODOS los datos de la Regla 2, hazle un resumen completo usando emojis y este formato exacto:
👤 *Nombre:* [Nombre]
📅 *Fecha de entrega:* [Fecha]
🍰 *Tamaño principal:* [Personas]
💠 *Forma:* [Forma]
🏢 *Tipo / Pisos:* [Normal o Detalle de Pisos]
➕ *Complementarios:* [Ninguno o Detalle]
🍞 *Sabor de pan:* [Sabor]
🍓 *Sabor de relleno:* [Sabor]
🎨 *Diseño:* [Diseño]
📸 *Imágenes adjuntas:* [Cantidad]
✍️ *Dedicatoria:* [Texto]
📍 *Tipo de entrega:* [Entrega]

Pregúntale: "¿Todo está correcto y estás de acuerdo con el pedido para generar tu folio? 😊". DETENTE AQUÍ. NO uses ninguna etiqueta todavía. Espera a que el cliente responda.

- PASO B: SI Y SÓLO SI el cliente ya respondió con un "Sí", "Correcto" o "Está bien" a tu resumen, ENTONCES tu respuesta debe incluir EXACTAMENTE la etiqueta [CREAR_FOLIO_AHORA] seguida de un objeto JSON con todos los datos estructurados (incluyendo arrays en "detallesPisos", "complementarios" y "imagenes_referencia") y una breve despedida.

REGLA 4 (FLUJO: VER DETALLES):
Si el cliente elige la opción 2, pídele su número de Folio.
Dile que con gusto le mostrarás todos los detalles de su compra.
Al recibir el número, responde: "Gracias. Voy a buscar todos los detalles de tu pedido. Un momento, por favor. [BUSCAR_FOLIO:numero]"
Ejemplo exacto: [BUSCAR_FOLIO:15]

REGLA 5 (ENFOQUE PROFESIONAL):
Ignora bromas o temas que no tengan que ver con la pastelería. Dirige siempre la plática hacia nuestros postres.

REGLA 6 (BUCLES Y LÓGICA AVANZADA):
A. BUCLE DE PISOS (Solo Base/Especial):
- ATENCIÓN: Si el cliente menciona la cantidad exacta de pisos (Ej. "3 pisos"), es TU OBLIGACIÓN recolectar los datos de CADA UNO de esos pisos sin saltarte ninguno.
- Inicia preguntando los sabores del "Piso 1" (base).
- Para los siguientes pisos (Piso 2, Piso 3, etc.), NO preguntes si quiere agregar otro. En su lugar, dile: "¿Para el Piso [Número] quieres los mismos sabores del piso anterior o prefieres sabores nuevos? (O si cambiaste de opinión, dime si prefieres dejar el pastel hasta aquí)".
- Si el cliente NO especificó cuántos pisos quería desde el principio, entonces sí pregunta después de cada piso: "¿Deseas agregar otro piso arriba?".
- Termina este bucle y avanza a Pasteles Complementarios SOLO cuando se hayan completado todos los pisos solicitados, o si el cliente explícitamente pide detenerse.

B. BUCLE DE COMPLEMENTARIOS:
- Si el cliente quiere pasteles extra, por cada uno pregunta: Tamaño y Forma (en un mensaje). Luego Pan y Relleno (en el siguiente).
- Al terminar un pastel extra, pregunta: "¿Deseas agregar otro pastel extra o sería todo por ahora?".
- Si SÍ, repite. Si NO, avanza a Diseño.

C. IMÁGENES DE REFERENCIA:
- Dile al cliente: "Si tienes imágenes de referencia para tu diseño, por favor envíamelas ahora (Máximo 5). Si no tienes, dime 'No'".
- Si envía una imagen, responde: "📸 Recibí tu imagen. ¿Mandarás otra? (Llevamos X de 5) o dime 'Listo'".
- Si llegan a 5 o el cliente dice "Listo/No", avanza al Tipo de entrega.

REGLA 7 (FORMATO DE SALIDA JSON ESTRICTO):
Cuando el cliente confirme el resumen respondiendo "Sí" (Paso B de la Regla 3), debes emitir INMEDIATAMENTE la etiqueta [CREAR_FOLIO_AHORA] seguida de un bloque de código JSON con TODOS los datos recolectados. Usa EXACTAMENTE esta estructura de ejemplo como guía:

[CREAR_FOLIO_AHORA]
{
  "cliente_nombre": "Juan Pérez",
  "numero_personas": 50,
  "forma": "Redondo",
  "tipo_folio": "Base/Especial",
  "detallesPisos": [
    { "piso": 1, "sabores_pan": ["Vainilla", "Chocolate"], "rellenos": ["Fresa"] },
    { "piso": 2, "sabores_pan": ["Zanahoria"], "rellenos": ["Queso Crema"] }
  ],
  "complementarios": [
    { "numero_personas": 20, "forma": "Plancha", "sabores_pan": ["Chocolate"], "rellenos": ["Cajeta"] }
  ],
  "descripcion_diseno": "Pastel temático de Batman, colores oscuros.",
  "fecha_entrega": "2023-12-25",
  "hora_entrega": "14:00"
}`;

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