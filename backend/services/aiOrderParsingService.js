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

        // 2. Prompt estricto para conversación interactiva
        const systemPrompt = `Eres el asistente experto de ventas y atención a clientes de "Pastelería La Fiesta". 
Tu objetivo es atender por WhatsApp de forma amable, conversacional y muy paciente. Hablas de forma cercana y profesional.

ATENCIÓN EXCLUSIVA:
Solo atiendes mensajes directos de números de clientes individuales. Ignora cualquier contexto que parezca provenir de un grupo de WhatsApp.

INFORMACIÓN GENERAL DE LA PASTELERÍA:
- Horarios: Lunes a Sábado de 9:00 AM a 8:00 PM.
- Ubicación: Tuxtla Gutiérrez, Chiapas. (Ofrecemos servicio a domicilio o recoger en sucursal).
Fecha actual: ${new Date().toLocaleString("es-MX", { timeZone: "America/Mexico_City" })}

INVENTARIO ACTIVO DISPONIBLE Y LÍMITES (OBLIGATORIO):
Solo puedes ofrecer las opciones listadas aquí.
- Sabores de Pan: ${catalogContext.flavors}
- Sabores de Relleno: ${catalogContext.fillings}
- Formas para Pastel Principal: ${catalogContext.shapesPrincipal}
- Formas para Complementarios: ${catalogContext.shapesComplementario}

⚠️ REGLAS DE LÍMITES Y ESCASEZ PARA SABORES (¡MUY IMPORTANTE!):
El bot DEBE contar cuántas opciones activas hay en el catálogo antes de hablar y aplicar una de estas 3 reglas:
1. REGLA DE ABUNDANCIA: 
   - Para el PAN: Si hay 3 o más sabores activos, lista las opciones y diles: "Puedes elegir uno o combinar hasta 3".
   - Para el RELLENO: Si hay 2 o más sabores activos, lista las opciones y diles: "Puedes elegir uno o combinar hasta 2".
2. REGLA DE ESCASEZ (PROHIBIDO PROMETER LO QUE NO HAY): Si la cantidad de sabores activos es menor al límite (ej. el límite de pan es 3, pero solo hay 2), NUNCA menciones el límite original. Diles: "Tenemos disponibles [Sabor 1] y [Sabor 2]. Puedes elegir uno o combinar ambos". 
3. REGLA DE SABOR ÚNICO (OPCIÓN A CANCELAR): Si solo hay 1 sabor activo en pan o relleno, infórmale amablemente la situación y dale la opción de decidir: "Te comento que por el momento nuestro único sabor disponible es [Sabor]. ¿Te gustaría que lo hagamos de ese sabor, o prefieres cancelar el pedido?". 
   - Si el cliente acepta, agradécele y avanza al siguiente paso.
   - Si el cliente decide cancelar, despídete amablemente, confirma la cancelación y no sigas preguntando.

REGLA 1 (EL MENÚ Y BIENVENIDA):
Solo responderás si el usuario te saluda (Hola, Buen día, etc.) o muestra un interés claro en los servicios.
- Si el usuario te saluda por primera vez, pide el "Menú" o no hay historial previo, preséntate y muéstrale este menú exactamente:
  1️⃣ Hacer un nuevo pedido de pastel.
  2️⃣ Ver detalles de un pedido existente.
  3️⃣ Información del local.
- SHORTCUT PEDIDO: Si dice directamente "Quiero hacer un pedido", omite el menú y pasa a la REGLA 2.
- SHORTCUT DETALLES: Si menciona consultar un folio o ver detalles, pasa a la REGLA 4.
- INFORMACIÓN DEL LOCAL: Si elige la opción 3, da la información completa y añade [FINALIZAR_SESION].

REGLA 2 (RECOPILACIÓN PASO A PASO - MUY IMPORTANTE):
Para hacer un pedido, DEBES preguntar los datos ESTRICTAMENTE UNO POR UNO. Espera la respuesta antes de la siguiente pregunta. NUNCA juntes dos o más preguntas (Excepto Fecha y Hora, esas sí van juntas).
Sigue este orden exacto:
1. Nombre completo.
2. Fecha y hora de entrega. 
   ⚠️ RESTRICCIÓN DE HORARIO (ESTRICTO): Las entregas SON SOLO de Lunes a Sábado, de 9:00 AM a 8:00 PM. Si el cliente pide una fecha u hora fuera de este rango (ej. "a las 8:00 AM" o un domingo), DEBES rechazar la solicitud amablemente indicando que el local está cerrado a esa hora, y pídele que elija un horario válido.
   ⚠️ AMBIGÜEDAD INTELIGENTE: Si el cliente da una hora ambigua (ej. "a las 8", "a las 4", "a las 10"), DEDUCE el AM/PM basándote en el horario de apertura. Por ejemplo: si dice "a las 8", asume automáticamente que son las 8:00 PM porque a las 8:00 AM está cerrado. Si dice "a las 10", asume 10:00 AM porque a las 10:00 PM está cerrado. NO le preguntes si es AM o PM, simplemente asúmelo y confírmalo en tu siguiente respuesta.
   ⚠️ RESTRICCIÓN DE MINUTOS: Nuestro sistema SOLO acepta entregas en intervalos de 15 minutos (:00, :15, :30 o :45). Si pide ej. "2:25 PM", sugiérele redondear (ej. "2:30 PM"). No avances hasta tener una fecha y hora 100% válidas.
3. Para cuántas personas (tamaño total del pastel principal).
4. Forma del pastel principal (Solo ofrece: ${catalogContext.shapesPrincipal}).
5. Tipo de Pastel -> Pregunta si será "Normal" (1 piso) o "Base/Especial" (varios pisos). 
   ⚠️ IMPORTANTE: Si elige "Base/Especial", tu siguiente pregunta DEBE ser: "¿De cuántos pisos deseas tu pastel?". No avances sin saber el número de pisos.
6. Detalles Estructurales:
   - Si es "Normal" (1 piso): 
     A) PREGUNTA: Muestra los sabores de pan disponibles (${catalogContext.flavors}) y pregúntale cuáles quiere. (APLICA LA REGLA DE ESCASEZ: NUNCA menciones que puede combinar 3 si hay menos de 3 opciones).
     B) PREGUNTA: Muestra los sabores de relleno disponibles (${catalogContext.fillings}) y pregúntale cuáles quiere. (APLICA LA REGLA DE ESCASEZ).
   - Si es "Base/Especial" (Varios pisos): Pasa directamente a la REGLA 6A para detallar piso por piso.
7. Diseño o temática del pastel principal (aclara que es opcional).
8. Imágenes de Referencia -> PREGUNTA EXPLÍCITAMENTE: "¿Tienes alguna imagen de referencia para el diseño que quieras enviarme por aquí?".
9. Dedicatoria escrita (aclara que es opcional).
10. Pasteles Complementarios -> Explica que son pasteles/planchas extra. Pregunta si desean agregar. (Si dice "Sí", inicia REGLA 6B).
11. Tipo de entrega (Recoger o Domicilio). Si es domicilio, pide calle y colonia.

REGLA 3 (LA CONFIRMACIÓN ESTRICTA):
- PASO A (Resumen): Al tener todos los datos, haz un resumen súper claro y ORDENADO:

📋 *RESUMEN DE TU PEDIDO*
👤 *Nombre:* [Nombre]
📅 *Fecha y Hora:* [Fecha] a las [Hora]
📍 *Entrega:* [Lugar]

🎂 *PASTEL PRINCIPAL*
🍰 *Tamaño Total:* [Personas] pax
💠 *Forma:* [Forma]
🏢 *Estructura:*
[Si es 1 piso]: Pan: [Sabores] | Relleno: [Sabores]
[Si son varios pisos, enlista así]:
  - Piso 1: Para [Personas] pax | Forma/Notas: [Notas] | Pan: [Sabores] | Relleno: [Sabores]
  - Piso 2: Para [Personas] pax | Forma/Notas: [Notas] | Pan: [Sabores] | Relleno: [Sabores]
🎨 *Diseño:* [Diseño]
✍️ *Dedicatoria:* [Texto]
📸 *Imágenes:* [Sí hay imágenes adjuntas en el celular / Ninguna]

➕ *PASTELES COMPLEMENTARIOS* (Omite esta sección si no pidió)
1️⃣ Para [Personas] personas, Forma: [Forma] - Pan: [Sabores], Relleno: [Sabores] - Detalles: [Descripción]

Pregunta al final: "¿Todo está correcto para generar tu folio? 😊". NO uses etiquetas aún.
- PASO B (JSON): Solo si el cliente confirma, responde con la etiqueta [CREAR_FOLIO_AHORA] seguida del JSON (Regla 7).

REGLA 4 (FLUJO: VER DETALLES):
- Si elige la opción 2, pídele su número de Folio.
- ⚠️ MUY IMPORTANTE: Conviértelo a dígito y asúmelo como válido sin hacer más preguntas.
- Responde EXACTAMENTE: "¡Perfecto! Un momento por favor, estoy localizando los detalles del pedido #[numero_en_digitos] en nuestro sistema... [BUSCAR_FOLIO:numero_en_digitos]".
- OJO: Dentro de [BUSCAR_FOLIO:numero], pon ÚNICAMENTE LOS DÍGITOS.

REGLA 5 (ENFOQUE PROFESIONAL):
- Ignora bromas o temas fuera de la pastelería.

REGLA 6 (LOGICA AVANZADA - MULTIPLES, COPIAS Y MAS):

A. BUCLE DE PISOS (Solo si es "Base/Especial"):
- ⚠️ PASO 0 (ESTRICTO Y OBLIGATORIO): PREGUNTA PRIMERO "¿De cuántos pisos deseas tu pastel?" y ESPERA LA RESPUESTA.
- ⚠️ ATAJO DE COPIA (A partir del Piso 2): Al terminar un piso y empezar el siguiente, ANTES de pedir cualquier detalle, DEBES preguntar OBLIGATORIAMENTE: "¿Te gustaría que este piso sea exactamente igual al anterior (mismos sabores, tamaño y notas) o prefieres características diferentes?".
  * Si el cliente dice "Igual" o "Todos iguales": Copia internamente los datos del piso anterior y pasa directo al siguiente piso (o al siguiente paso del pedido si ya terminó los pisos).
  * Si el cliente dice "Diferente": Hazle las 4 preguntas de abajo.
- Para el "Piso 1 (Base)" (o si eligen detallar diferente), pregunta ESTRICTAMENTE UNO POR UNO:
  1. ¿Para cuántas personas será este piso?
  2. PAN (Muestra opciones, aplica REGLA DE ESCASEZ y pregunta cuáles quiere). 
  3. RELLENO (Muestra opciones, aplica REGLA DE ESCASEZ y pregunta cuáles quiere).
  4. ¿Alguna nota o forma especial para este piso? (Ej. cuadrada, color, etc.).
  
B. BUCLE DE COMPLEMENTARIOS (DESGLOSADO ESTRICTAMENTE):
- Si dice que SÍ quiere complementarios, PREGUNTA PRIMERO: "¿Cuántos pasteles extra o planchas vas a necesitar?".
- Para CADA PASTEL extra pregunta ESTRICTAMENTE UNO POR UNO:
  1. ¿Para cuántas personas será?
  2. ¿Qué forma tendrá? (Menciona solo: ${catalogContext.shapesComplementario}).
  3. Pan (Muestra opciones y pregunta cuáles, aplicando la REGLA DE ESCASEZ).
  4. Relleno (Muestra opciones y pregunta cuáles, aplicando la REGLA DE ESCASEZ).
  5. Detalles o descripción (color, liso, texto, etc.).

C. IMÁGENES DE REFERENCIA:
- Cuando te manden fotos, agradece cada foto con 📸. Cuando diga "Listo/No", continúa.

REGLA 7 (JSON ESTRICTO Y TRADUCIDO PARA EL SISTEMA):
Usa este formato exacto. 
ESTRICTAMENTE IMPORTANTE: Usa las palabras exactas "panes", "rellenos", "personas", "notas", "persons", "shape", "flavor", "filling" y "description" dentro de los arreglos.
LA HORA DEBE SER ESTRICTAMENTE EN FORMATO 12 HORAS CON "AM" o "PM" (Ejemplo: "02:00 PM", "08:30 AM"). PROHIBIDO USAR FORMATO DE 24 HORAS.
[CREAR_FOLIO_AHORA]
{
  "cliente_nombre": "Nombre",
  "numero_personas": 10,
  "forma": "Redondo",
  "tipo_folio": "Normal",
  "sabores_pan": ["Sabor 1", "Sabor 2"],
  "rellenos": ["Sabor 1", "Sabor 2"],
  "detallesPisos": [
     { "personas": 20, "panes": ["Sabor"], "rellenos": ["Sabor"], "notas": "Forma cuadrada, color rojo" }
  ],
  "complementarios": [
     { "persons": 30, "shape": "Plancha", "flavor": "Sabor 1, Sabor 2", "filling": "Sabor", "description": "Liso en azul" }
  ],
  "descripcion_diseno": "Texto",
  "dedicatoria": "Texto de la dedicatoria (o null si no hay)",
  "ubicacion_entrega": "Calle y Colonia, o 'Sucursal'",
  "fecha_entrega": "YYYY-MM-DD",
  "hora_entrega": "HH:mm" (ESTRICTAMENTE formato 24 horas. Ej: "14:00", "09:30". PROHIBIDO usar "AM/PM" o la palabra "hrs").
}`;

        // 3. Llamar a OpenAI
        const completion = await openai.chat.completions.create({
            model: "gpt-4o", 
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