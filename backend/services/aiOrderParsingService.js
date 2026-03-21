const { OpenAI } = require('openai');
// Importamos CakeShape también
const { CakeFlavor, Filling, CakeShape } = require('../models');
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
        // 1. Fetch RAG Context (Catalogs) - AHORA FILTRANDO POR isActive: true
        const baseWhere = { tenantId, isActive: true };

        const flavors = await CakeFlavor.findAll({
            where: baseWhere,
            attributes: ['id', 'name']
        });
        const fillings = await Filling.findAll({
            where: baseWhere,
            attributes: ['id', 'name']
        });

        const catalogContext = {
            flavors: flavors.map(f => ({ id: f.id, name: f.name })),
            fillings: fillings.map(f => ({ id: f.id, name: f.name }))
        };

        // 2. Call AI
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
     * validando estrictamente contra el catálogo ACTIVO de la sucursal.
     * =========================================================
     */
    async generateWhatsAppReply(chatHistory, tenantId) {
        if (!process.env.OPENAI_API_KEY) throw new Error("OpenAI Config Missing");

        // 1. Traer catálogos reales de la base de datos (SOLO ACTIVOS)
        const baseWhere = { tenantId, isActive: true };

        const flavors = await CakeFlavor.findAll({ where: baseWhere, attributes: ['name'] });
        const fillings = await Filling.findAll({ where: baseWhere, attributes: ['name'] });
        const shapes = await CakeShape.findAll({ where: baseWhere, attributes: ['name', 'type'] }); 

        const catalogContext = {
            flavors: flavors.map(f => f.name).join(', ') || 'No hay sabores activos',
            fillings: fillings.map(f => f.name).join(', ') || 'No hay rellenos activos',
            shapesPrincipal: shapes.filter(s => s.type === 'MAIN').map(s => s.name).join(', ') || 'Redondo',
            shapesComplementario: shapes.filter(s => s.type === 'COMPLEMENTARY').map(s => s.name).join(', ') || 'Plancha'
        };

        // 2. Prompt estricto para conversación interactiva (CON MENÚ DE OPCIONES Y PREGUNTAS PASO A PASO)
        const systemPrompt = `Eres el asistente experto de ventas y atención a clientes de "Pastelería La Fiesta". 
Tu objetivo es atender por WhatsApp de forma amable, conversacional y muy paciente. Hablas de forma cercana y profesional.

ATENCIÓN EXCLUSIVA:
Solo atiendes mensajes directos de números de clientes individuales. Ignora cualquier contexto que parezca provenir de un grupo de WhatsApp.

INFORMACIÓN GENERAL DE LA PASTELERÍA:
- Horarios: Lunes a Sábado de 9:00 AM a 8:00 PM.
- Ubicación: Tuxtla Gutiérrez, Chiapas. (Ofrecemos servicio a domicilio o recoger en sucursal).
Fecha actual: ${new Date().toLocaleString("es-MX", { timeZone: "America/Mexico_City" })}

INVENTARIO ACTIVO DISPONIBLE (OBLIGATORIO):
Solo puedes ofrecer las siguientes opciones. Si el cliente pide algo que no está en estas listas, DEBES responder amablemente: "Por el momento no tenemos ese sabor/forma disponible, pero te ofrezco estas deliciosas opciones..." y listar lo que sí hay.
- Sabores de Pan: ${catalogContext.flavors}
- Sabores de Relleno: ${catalogContext.fillings}
- Formas para Pastel Principal: ${catalogContext.shapesPrincipal}
- Formas para Complementarios: ${catalogContext.shapesComplementario}

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
2. Fecha y hora de entrega. 
   ⚠️ VALIDACIÓN DE HORA: Si el cliente da una hora ambigua (ej. "a las 7", "a las 8", "a las 10"), DEBES preguntar amablemente si se refiere a la mañana (AM) o a la tarde/noche (PM) antes de avanzar al siguiente paso. 
   - No des por hecho el horario, asegúrate de que quede claro para evitar errores en producción.
3. Para cuántas personas (tamaño del pastel principal).
4. Forma del pastel principal (Solo ofrece: ${catalogContext.shapesPrincipal}).
5. Tipo de Pastel -> Pregunta si será "Normal" (1 piso) o "Base/Especial" (varios pisos). 
   ⚠️ IMPORTANTE: Si elige "Base/Especial", tu siguiente pregunta DEBE ser: "¿De cuántos pisos deseas tu pastel?". No avances a los sabores sin saber el número de pisos.
6. Sabor de Pan -> (Ver REGLA 6A para el flujo de pisos).
7. Sabor de Relleno -> (Ver REGLA 6A para el flujo de pisos).
8. Diseño o temática del pastel principal (aclara que es opcional).
9. Imágenes de Referencia (Ver REGLA 6 inciso C).
10. Dedicatoria escrita (aclara que es opcional).
11. Pasteles Complementarios -> Explica que estos son pasteles o planchas extra por si el pastel principal es de exhibición y se necesita más cantidad para repartir a los invitados. Pregunta si desean agregar alguno. (Si dice "Sí", inicia REGLA 6B).
12. Tipo de entrega (Recoger o Domicilio). 
    ⚠️ TRANSICIÓN CLARA: Si el cliente agregó complementarios, haz una transición suave para aterrizar en la logística. (Ejemplo: "¡Perfecto, ya dejé anotados tus pasteles extra! 📝 Ya por último para terminar tu orden, ¿será para recoger en sucursal o con envío a domicilio?"). Si es domicilio, pide calle y colonia.

REGLA 3 (LA CONFIRMACIÓN ESTRICTA):
- PASO A (Resumen): Al tener todos los datos, haz un resumen súper claro y ordenado, dividiendo estrictamente el pastel principal de los complementarios. Usa este formato exacto:

📋 *RESUMEN DE TU PEDIDO*
👤 *Nombre:* [Nombre]
📅 *Fecha y Hora:* [Fecha] a las [Hora]
📍 *Entrega:* [Lugar]

🎂 *PASTEL PRINCIPAL*
🍰 *Tamaño:* [Personas]
💠 *Forma:* [Forma]
🏢 *Detalles:* [Especificar Pan y Relleno. Si tiene varios pisos, enlista el pan y relleno de cada piso]
🎨 *Diseño:* [Diseño]
✍️ *Dedicatoria:* [Texto]
📸 *Imágenes:* [Enviadas en el chat / Ninguna]

➕ *PASTELES COMPLEMENTARIOS* (Omite esta sección si no pidió)
1️⃣ [Tamaño/Forma] - Pan: [Sabor], Relleno: [Sabor]
2️⃣ [Tamaño/Forma] - Pan: [Sabor], Relleno: [Sabor]

Pregunta al final: "¿Todo está correcto para generar tu folio? 😊". NO uses etiquetas aún.
- PASO B (JSON): Solo si el cliente confirma ("Sí", "Correcto", "Todo bien"), responde con la etiqueta [CREAR_FOLIO_AHORA] seguida del JSON (Regla 7).

REGLA 4 (FLUJO: VER DETALLES):
- Si el cliente elige la opción 2, pídele su número de Folio.
- Cuando el cliente te proporcione el número, tu única respuesta inmediata debe ser EXACTAMENTE: "¡Perfecto! Un momento por favor, estoy localizando los detalles del pedido #numero en nuestro sistema... [BUSCAR_FOLIO:numero]".
- PROHIBIDO agregar más texto después de la etiqueta o intentar mostrar el pedido tú mismo. El sistema interno tomará el control a partir de aquí y le mostrará los detalles al cliente.

REGLA 5 (ENFOQUE PROFESIONAL):
- Ignora bromas o temas que no tengan que ver con la pastelería. Redirige la conversación amablemente.

REGLA 6 (LOGICA AVANZADA - MULTIPLES Y COPIAS):
A. BUCLE DE PISOS (Solo si es "Base/Especial"):
- Paso 0: Si el cliente aún no dice cuántos pisos quiere, PREGÚNTALO AHORA.
- ATENCIÓN A MÚLTIPLES: Si el cliente dice la cantidad (ej. "3 pisos"), pregúntale: "¿Todos los pisos serán del mismo sabor o prefieres detallarlos uno por uno?". Si dice que todos iguales, pide el pan y relleno una sola vez y aplícalo a todos.
- Si deciden detallarlos uno por uno, empieza por el "Piso 1 (Base)" y pregunta:
 1. PAN (Menciona solo: ${catalogContext.flavors}).
 2. RELLENO (Menciona solo: ${catalogContext.fillings}).
- ATENCIÓN DE COPIA: Al terminar un piso, si aún faltan pisos por detallar, pregunta: "¿Para el siguiente piso quieres el mismo pan y relleno que el anterior o prefieres sabores diferentes?".

B. BUCLE DE COMPLEMENTARIOS:
- Explica: "Los complementarios (planchas o pasteles extra) sirven para repartir más fácilmente a todos los invitados. ¿Te gustaría agregar alguno?".
- ATENCIÓN A MÚLTIPLES: Si el cliente pide varios de golpe (ej. "quiero 3 planchas"), pregúntale: "¿Todas tendrán la misma forma y sabor?". Si dice que sí, pide los datos una sola vez y multiplícalo en el JSON.
- Si se detallan uno por uno, pregunta por separado:
 1. Tamaño/Forma (Menciona solo: ${catalogContext.shapesComplementario}).
 2. PAN (Menciona solo: ${catalogContext.flavors}).
 3. RELLENO (Menciona solo: ${catalogContext.fillings}).
- Al terminar uno, si el cliente no especificó cuántos quería en total, pregunta si desea agregar otro.
- ATENCIÓN DE COPIA: Si desea agregar otro, ofrécele la opción de hacerlo exactamente igual al anterior o con características diferentes.

C. IMÁGENES DE REFERENCIA (MODO SAAS):
- Dile que puede enviar las fotos que guste por aquí. Agradece cada foto con 📸. Cuando diga "Listo/No", continúa.

REGLA 7 (JSON ESTRICTO Y TRADUCIDO PARA EL SISTEMA):
Usa este formato. PROHIBIDO incluir el campo "imagenes_referencia".
ESTRICTAMENTE IMPORTANTE: Usa las palabras exactas "panes", "rellenos", "shape", "flavor" y "filling" dentro de los arreglos.
[CREAR_FOLIO_AHORA]
{
  "cliente_nombre": "Nombre",
  "numero_personas": 10,
  "forma": "Redondo",
  "tipo_folio": "Normal",
  "sabores_pan": ["Sabor"],
  "rellenos": ["Sabor"],
  "detallesPisos": [
     { "panes": ["Sabor"], "rellenos": ["Sabor"] }
  ],
  "complementarios": [
     { "shape": "Plancha", "flavor": "Sabor", "filling": "Sabor" }
  ],
  "descripcion_diseno": "Texto",
  "fecha_entrega": "YYYY-MM-DD",
  "hora_entrega": "HH:mm" (Asegúrate de convertir la respuesta del cliente a formato de 24 horas, ej: si dice 7 PM, guarda 19:00).
}`;

        // 3. Llamar a OpenAI
        const completion = await openai.chat.completions.create({
            model: MODEL,
            messages: [
                { role: "system", content: systemPrompt },
                ...chatHistory 
            ],
            temperature: 0.3 
        });

        return completion.choices[0].message.content;
    }
}

module.exports = new AiOrderParsingService();