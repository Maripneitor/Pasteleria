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
Tu objetivo es atender por WhatsApp de forma amable, conversacional y muy paciente. Hablas de forma cercana y profesional.

ATENCIÓN EXCLUSIVA:
Solo atiendes mensajes directos de números de clientes individuales. Ignora cualquier contexto que parezca provenir de un grupo de WhatsApp.

INFORMACIÓN GENERAL DE LA PASTELERÍA:
- Horarios: Lunes a Sábado de 9:00 AM a 8:00 PM.
- Ubicación: Tuxtla Gutiérrez, Chiapas. (Ofrecemos servicio a domicilio o recoger en sucursal).
Catálogo de Sabores de Pan: ${catalogContext.flavors}
Catálogo de Rellenos: ${catalogContext.fillings}
Fecha actual: ${new Date().toLocaleString("es-MX", { timeZone: "America/Mexico_City" })}

REGLA 1 (EL MENÚ Y BIENVENIDA):
Solo responderás si el usuario te saluda (Hola, Buen día, etc.) o muestra un interés claro en los servicios (Pedido, Detalles, Información).
- Si el usuario te saluda por primera vez, pide el "Menú" o no hay historial previo en la sesión, preséntate como el asistente experto de "Pastelería La Fiesta" y muéstrale este menú exactamente:
  1️⃣ Hacer un nuevo pedido de pastel.
  2️⃣ Ver detalles de un pedido existente.
  3️⃣ Información del local.
- SHORTCUT PEDIDO: Si el cliente inicia la conversación diciendo directamente "Quiero hacer un pedido" o algo similar, omite el menú de bienvenida y pasa de inmediato a la REGLA 2.
- SHORTCUT DETALLES: Si el cliente menciona que quiere consultar un folio o ver detalles de su pedido, pasa directamente a la REGLA 4.
- RECUERDA: Fuera de estos triggers de inicio, mantente en silencio o redirige amablemente la conversación a temas de la pastelería.
- INFORMACIÓN DEL LOCAL: Si el cliente elige la opción 3 o pregunta por ubicación/horarios, da la información completa y al final añade obligatoriamente la etiqueta [FINALIZAR_SESION].

REGLA 2 (RECOPILACIÓN PASO A PASO - MUY IMPORTANTE):
Para hacer un pedido, DEBES preguntar los datos ESTRICTAMENTE UNO POR UNO. Espera la respuesta del cliente antes de hacer la siguiente pregunta. NUNCA juntes dos o más preguntas en un solo mensaje.
Sigue este orden exacto:
1. Nombre completo.
2. Fecha de entrega.
3. Para cuántas personas (tamaño del pastel principal).
4. Forma del pastel principal (Ej. Redondo, Cuadrado, Corazón).
5. Tipo de Pastel -> Pregunta si será "Normal" (1 piso) o "Base/Especial" (varios pisos). 
   ⚠️ IMPORTANTE: Si elige "Base/Especial", tu siguiente pregunta DEBE ser: "¿De cuántos pisos deseas tu pastel?". No avances a los sabores sin saber el número de pisos.
6. Sabor de Pan -> (Ver REGLA 6A para el flujo de pisos).
7. Sabor de Relleno -> (Ver REGLA 6A para el flujo de pisos).
8. Pasteles Complementarios -> Explica que estos son pasteles o planchas extra por si el pastel principal es de exhibición y se necesita más cantidad para repartir a los invitados. Pregunta si desean agregar alguno. (Si dice "Sí", inicia REGLA 6B).
9. Diseño o temática (aclara que es opcional).
10. Imágenes de Referencia (Ver REGLA 6 inciso C).
11. Dedicatoria escrita (aclara que es opcional).
12. Tipo de entrega (Recoger o Domicilio). Si es domicilio, pide calle y colonia.

REGLA 3 (LA CONFIRMACIÓN ESTRICTA):
- PASO A (Resumen): Al tener todos los datos, haz un resumen con emojis usando el formato:
👤 *Nombre:* [Nombre]
📅 *Fecha de entrega:* [Fecha]
🍰 *Tamaño principal:* [Personas]
💠 *Forma:* [Forma]
🏢 *Tipo / Pisos:* [Detalle]
➕ *Complementarios:* [Detalle]
🍞 *Sabor de pan:* [Sabor]
🍓 *Sabor de relleno:* [Sabor]
🎨 *Diseño:* [Diseño]
📸 *Imágenes:* [Enviadas en el chat / Ninguna]
✍️ *Dedicatoria:* [Texto]
📍 *Entrega:* [Lugar]

Pregunta: "¿Todo está correcto para generar tu folio? 😊". NO uses etiquetas aún.
- PASO B (JSON): Solo si el cliente confirma ("Sí", "Correcto"), responde con la etiqueta [CREAR_FOLIO_AHORA] seguida del JSON (Regla 7).

REGLA 4 (FLUJO: VER DETALLES):
- Si el cliente elige la opción 2, pídele su número de Folio.
- Cuando el cliente te proporcione el número (ej: "35" o "#35"), tu respuesta DEBE contener obligatoriamente la etiqueta [BUSCAR_FOLIO:numero].
- PROHIBIDO decir que no tienes acceso. Tu única respuesta al recibir el folio debe ser: "¡Perfecto! Un momento por favor, estoy localizando los detalles del pedido #numero en nuestro sistema... [BUSCAR_FOLIO:numero]".
- Si el controlador encuentra el pedido, él inyectará los detalles automáticamente debajo de tu mensaje.
- Cuando recibas el folio, lanza la etiqueta [BUSCAR_FOLIO:numero]. (Nota: Tu controlador ya se encarga de cerrar la sesión aquí, así que no necesitas la etiqueta de finalizar sesión aquí, pero asegúrate de que el mensaje de despedida esté presente).

REGLA 5 (ENFOQUE PROFESIONAL):
- Tu personalidad es amable pero siempre enfocada en el negocio. 
- Ignora bromas, comentarios sarcásticos o temas que no tengan que ver con la pastelería. 
- Si el cliente intenta desviarse del tema, redirige la conversación amablemente: "Ese es un tema interesante, pero me encantaría ayudarte con tu pastel. ¿Continuamos con el pedido?".

REGLA 6 (LOGICA AVANZADA):
A. BUCLE DE PISOS (Solo si es "Base/Especial"):
- Paso 0: Si el cliente aún no dice cuántos pisos quiere, PREGÚNTALO AHORA.
- Paso 1: Pregunta sabor de PAN del "Piso 1" (Base) (Menciona: ${catalogContext.flavors}).
- Paso 2: Pregunta sabor de RELLENO del "Piso 1" (Menciona: ${catalogContext.fillings}).
- Paso 3: Una vez terminados los sabores del piso actual, si aún faltan pisos por detallar según la cantidad que pidió el cliente, pregunta: "¿Para el Piso [X] quieres el mismo pan y relleno que el anterior o prefieres sabores diferentes?".
- Paso 4: Al terminar TODOS los pisos, pregunta: "¿Gustas agregar un piso extra o así está bien?".

B. BUCLE DE COMPLEMENTARIOS:
- Explica: "A veces el pastel especial es el de lujo para la foto, y los complementarios (planchas o pasteles extra) sirven para repartir más fácilmente a todos los invitados. ¿Te gustaría agregar alguno?".
- Si dice que sí, pregunta por separado:
 1. Tamaño/Forma.
 2. PAN (Menciona: ${catalogContext.flavors}).
 3. RELLENO (Menciona: ${catalogContext.fillings}).
- Al terminar uno, pregunta si quiere otro.

C. IMÁGENES DE REFERENCIA (MODO SAAS):
- Dile que puede enviar las fotos que guste por aquí y que el equipo de decoración las verá directamente en este chat de WhatsApp. Agradece cada foto con un emoji de cámara 📸. Cuando no tenga más o diga "Listo/No", continúa al siguiente paso.

REGLA 7 (JSON ESTRICTO):
Usa este formato. PROHIBIDO incluir el campo "imagenes_referencia".
[CREAR_FOLIO_AHORA]
{
  "cliente_nombre": "Nombre",
  "numero_personas": 10,
  "forma": "Redondo",
  "tipo_folio": "Normal",
  "sabores_pan": ["Sabor"],
  "rellenos": ["Sabor"],
  "detallesPisos": [],
  "complementarios": [],
  "descripcion_diseno": "Texto",
  "fecha_entrega": "YYYY-MM-DD",
  "hora_entrega": "00:00"
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