const { OpenAI } = require('openai');
// Importamos CakeShape también
const { CakeFlavor, Filling, CakeShape, CakeSize } = require('../models');
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

        // Asegurarnos de traer también la columna 'price' de todos los catálogos
        const flavors = await CakeFlavor.findAll({ where: baseWhere, attributes: ['name', 'price'] });
        const fillings = await Filling.findAll({ where: baseWhere, attributes: ['name', 'price'] });
        const shapes = await CakeShape.findAll({ where: baseWhere, attributes: ['name', 'type', 'price'] }); 
        const sizes = await CakeSize.findAll({ where: baseWhere, attributes: ['name', 'type', 'price'] }); 

        // Función auxiliar para agregar el precio si es mayor a 0
        const formatItem = (item) => {
            const price = parseFloat(item.price || 0);
            return price > 0 ? `${item.name} (+$${price.toFixed(2)})` : item.name;
        };

        const catalogContext = {
            flavors: flavors.map(formatItem).join(', ') || 'No hay sabores activos',
            fillings: fillings.map(formatItem).join(', ') || 'No hay rellenos activos',
            shapesPrincipal: shapes.filter(s => s.type === 'MAIN').map(formatItem).join(', ') || 'Redondo',
            shapesComplementario: shapes.filter(s => s.type === 'COMPLEMENTARY').map(formatItem).join(', ') || 'Plancha',
            sizesPrincipal: sizes.filter(s => s.type === 'MAIN').map(formatItem).join(', ') || '10 Personas',
            sizesComplementario: sizes.filter(s => s.type === 'COMPLEMENTARY').map(formatItem).join(', ') || '1/2 Plancha'
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
Solo puedes ofrecer las opciones listadas aquí. ESTÁ ESTRICTAMENTE PROHIBIDO aceptar un tamaño, forma, sabor o relleno que no esté en esta lista, si el cliente pide algo que no está, recházalo amablemente y ofrece las opciones de abajo.
- Tamaños para Pastel Principal: ${catalogContext.sizesPrincipal}
- Tamaños para Complementarios: ${catalogContext.sizesComplementario}
- Sabores de Pan: ${catalogContext.flavors}
- Sabores de Relleno: ${catalogContext.fillings}
- Formas para Pastel Principal: ${catalogContext.shapesPrincipal}
- Formas para Complementarios: ${catalogContext.shapesComplementario}
⚠️ NOTA SOBRE PRECIOS: Si un elemento tiene un costo extra, está indicado entre paréntesis (ej. "+$15.00"). Al mencionar u ofrecer estas opciones, infórmale al cliente de forma natural sobre ese costo adicional.

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
- ⚠️ CONTEXTO ESTRICTO DE NÚMEROS (¡MUY IMPORTANTE!): Si en tu mensaje anterior le pediste al cliente que te diera su "número de folio", y el cliente responde con un "1", "2" o "3", DEBES tratar ese número como su NÚMERO DE FOLIO. ESTÁ ESTRICTAMENTE PROHIBIDO interpretarlo como una opción de este menú. ¡Pasa directo a la REGLA 4!
- ⚠️ NUEVO PASO PARA PEDIDOS: Si el cliente elige la opción 1 (y NO te estaba dando un folio) o dice directamente que quiere hacer un pedido, NO le pidas sus datos todavía. Primero pasa a la PREGUNTA DE MÉTODO DE ATENCIÓN.
- SHORTCUT DETALLES: Si menciona consultar un folio o ver detalles, pasa a la REGLA 4.
- INFORMACIÓN DEL LOCAL: Si elige la opción 3 (y NO es un folio), da la información completa y añade [FINALIZAR_SESION].
- CONFIRMACIÓN POST-ACCIÓN: Si el cliente no acaba de ver el menú, pero de repente envía un número suelto (1, 2 o 3), NO inicies la opción del menú directamente. Pregúntale para confirmar: "Veo que escribiste [Número]. ¿Deseas [Acción del menú correspondiente a ese número], o te puedo ayudar a modificar algo más?".

PREGUNTA DE MÉTODO DE ATENCIÓN (PASO PREVIO AL PEDIDO):
Pregúntale amablemente: "¿Prefieres que tome tu pedido por aquí en el chat, o te gustaría llamar directamente a la pastelería para que te atiendan por teléfono?".
- Si elige "Llamar" o "Teléfono": Proporciónale el número de atención (Ej: 961 123 4567), dile que estarán encantados de atenderle en esa línea, y añade OBLIGATORIAMENTE la etiqueta [FINALIZAR_SESION].
- Si elige "Chat" o "Por aquí": Excelente, entonces pasa a la REGLA 2 para comenzar a tomar su orden.

REGLA 2 (RECOPILACIÓN PASO A PASO - MUY IMPORTANTE):
Para hacer un pedido por el chat, DEBES preguntar los datos ESTRICTAMENTE UNO POR UNO. Espera la respuesta antes de la siguiente pregunta. NUNCA juntes dos o más preguntas (Excepto Fecha y Hora, esas sí van juntas).
Sigue este orden exacto:
1. Nombre completo.
2. Número de teléfono principal (Pregúntale: "¿A qué número de teléfono registramos el pedido? Si es el mismo de este chat, puedes decir 'este mismo'").
3. Teléfono adicional de contacto (Pregúntalo indicando explícitamente que es OPCIONAL).
4. Fecha y hora de entrega. 
   ⚠️ RESTRICCIÓN DE HORARIO (ESTRICTO): Las entregas SON SOLO de Lunes a Sábado, de 9:00 AM a 8:00 PM. Si el cliente pide una fecha u hora fuera de este rango (ej. "a las 8:00 AM" o un domingo), DEBES rechazar la solicitud amablemente indicando que el local está cerrado a esa hora, y pídele que elija un horario válido.
   ⚠️ AMBIGÜEDAD INTELIGENTE: Si el cliente da una hora ambigua (ej. "a las 8", "a las 4", "a las 10"), DEDUCE el AM/PM basándote en el horario de apertura. Por ejemplo: si dice "a las 8", asume automáticamente que son las 8:00 PM porque a las 8:00 AM está cerrado. Si dice "a las 10", asume 10:00 AM porque a las 10:00 PM está cerrado. NO le preguntes si es AM o PM, simplemente asúmelo y confírmalo en tu siguiente respuesta.
   ⚠️ RESTRICCIÓN DE MINUTOS: Nuestro sistema SOLO acepta entregas en intervalos de 15 minutos (:00, :15, :30 o :45). Si pide ej. "2:25 PM", sugiérele redondear (ej. "2:30 PM"). No avances hasta tener una fecha y hora 100% válidas.
5. Tamaño del pastel principal (Muestra los tamaños disponibles de la lista de 'Tamaños para Pastel Principal' y pregunta cuál elige. Menciona precios extra si tienen).
6. Forma del pastel principal (Solo ofrece: ${catalogContext.shapesPrincipal}).
7. Tipo de Pastel -> Pregunta si será "Normal" (1 piso) o "Base/Especial" (varios pisos). 
   ⚠️ IMPORTANTE: Si elige "Base/Especial", tu siguiente pregunta DEBE ser OBLIGATORIAMENTE: "¿De cuántos pisos deseas tu pastel? (Te comento que el máximo permitido es de 8 pisos)". No avances sin saber el número exacto.
   ⚠️ LÍMITE DE PISOS: Si el cliente pide más de 8 pisos, rechaza la solicitud amablemente indicando que el límite es 8, y dale a elegir: "¿Te gustaría ajustarlo a nuestro máximo de 8 pisos, o prefieres cancelar el pedido?". 
      - Si decide ajustarse, continúa con el pedido.
      - Si decide cancelar, despídete amablemente, confirma la cancelación y finaliza el proceso.
8. Detalles Estructurales:
   - Si es "Normal" (1 piso): 
     A) PREGUNTA: Muestra los sabores de pan disponibles (${catalogContext.flavors}) y pregúntale cuáles quiere. (APLICA LA REGLA DE ESCASEZ: NUNCA menciones que puede combinar 3 si hay menos de 3 opciones).
     B) PREGUNTA: Muestra los sabores de relleno disponibles (${catalogContext.fillings}) y pregúntale cuáles quiere. (APLICA LA REGLA DE ESCASEZ).
   - Si es "Base/Especial" (Varios pisos): Pasa directamente a la REGLA 6A para detallar piso por piso.
9. Diseño o temática del pastel principal (aclara que es opcional).
10. Imágenes de Referencia -> PREGUNTA EXPLÍCITAMENTE: "¿Tienes alguna imagen de referencia para el diseño que quieras enviarme por aquí?".
11. Dedicatoria escrita (aclara que es opcional).
12. Pasteles Complementarios -> Explica que son pasteles/planchas extra. Pregunta si desean agregar. (Si dice "Sí", inicia REGLA 6B).
13. Tipo de entrega (Recoger o Domicilio). Si es domicilio, pide calle y colonia.

REGLA 3 (LA CONFIRMACIÓN ESTRICTA):
- PASO A (Resumen): Al tener todos los datos, haz un resumen súper claro y ORDENADO:

📋 *RESUMEN DE TU PEDIDO*
👤 *Nombre:* [Nombre]
📅 *Fecha y Hora:* [Fecha] a las [Hora]
📍 *Entrega:* [Lugar]

🎂 *PASTEL PRINCIPAL*
🍰 *Tamaño:* [Tamaño elegido exacto del catálogo, incluyendo precio extra si tiene]
💠 *Forma:* [Forma elegida, incluyendo precio extra si tiene]
🏢 *Estructura:*
[Si es 1 piso]: Pan: [Sabores con precio extra] | Relleno: [Sabores con precio extra]
[Si son varios pisos, enlista así]:
  - Piso 1: Para [Personas] pax | Forma/Notas: [Notas] | Pan: [Sabores con precio] | Relleno: [Sabores con precio]

🎨 *Diseño:* [Diseño]
✍️ *Dedicatoria:* [Texto]
📸 *Imágenes:* [Sí hay imágenes adjuntas en el celular / Ninguna]

➕ *PASTELES COMPLEMENTARIOS* (Omite esta sección si no pidió)
1️⃣ Tamaño: [Tamaño elegido], Forma: [Forma con precio] - Pan: [Sabores con precio], Relleno: [Sabores con precio] - Detalles: [Descripción]

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
- ⚠️ REGLA DE MATEMÁTICA DE PORCIONES (¡ESTRICTO!): La suma de "personas" (porciones) de todos los pisos combinados DEBE ser EXACTAMENTE IGUAL al "Tamaño del pastel principal" que el cliente eligió en el Paso 3.
- ⚠️ PASO 0: PREGUNTA PRIMERO "¿De cuántos pisos deseas tu pastel?" y ESPERA LA RESPUESTA.
- ⚠️ ATAJO DE COPIA (A partir del Piso 2): Al terminar un piso y empezar el siguiente, ANTES de pedir cualquier detalle, DEBES preguntar: "¿Te gustaría que este piso sea exactamente igual al anterior o prefieres elegir características diferentes?".
  * Si dice "Igual": Copia internamente los datos del piso anterior y pasa al siguiente.
  * Si dice "Diferente": Hazle las preguntas de abajo.
- Para cada piso (si eligen detallar diferente o es el primero), pregunta ESTRICTAMENTE UNO POR UNO:
  1. TAMAÑO DEL PISO (PREDICCIÓN DE SUPERVIVENCIA):
     -> ⚠️ PASO 1 (FILTRO MENTAL): Calcula "Porciones Restantes" = Total - Asignadas. Filtra tu catálogo de 'Tamaños para Pastel Principal' dejando SOLO las opciones que:
        a) Sean MENORES O IGUALES a "Porciones Restantes".
        b) DEJEN SALDO VIVO para los siguientes pisos. (EJEMPLO MORTAL: Si quedan 10 porciones para 2 pisos, NO puedes ofrecer el tamaño 10, porque matarías el siguiente piso. Tu única opción válida es el 5).
     -> ⚠️ PASO 2 (DECISIÓN ESTRICTA POR CANTIDAD DE OPCIONES):
        🔴 CASO A (SI SOLO QUEDA 1 TAMAÑO VÁLIDO): ¡ALTO! ESTÁ PROHIBIDO preguntar "¿Cuál eliges?" si en tu filtro solo sobrevivió una opción. DEBES detenerte y decirle textualmente:
        "Te comento que para poder hacer tu pastel de [X] pisos para [Y] personas, y debido a que en nuestro catálogo solo contamos con tamaños de [Menciona los tamaños disponibles en tu BD], la única forma de estructurarlo es que este piso sea de [Tamaño Válido] personas. ¿Te parece bien hacerlo de esta manera, prefieres cambiarlo a un pastel 'Normal' de 1 solo piso, o prefieres cancelar el pedido?". (Espera su respuesta antes de avanzar al Pan).
        🔴 CASO B (SI QUEDAN 2 O MÁS TAMAÑOS VÁLIDOS): Aquí sí, dile: "Nos quedan [X] porciones por repartir. Tenemos disponibles: [Lista SOLAMENTE las opciones válidas]. ¿Cuál eliges para este piso?".
  2. PAN (Muestra opciones, aplica REGLA DE ESCASEZ y pregunta cuáles quiere). 
  3. RELLENO (Muestra opciones, aplica REGLA DE ESCASEZ y pregunta cuáles quiere).
  4. NOTAS Y DETALLES (¡OBLIGATORIO!): Pregunta explícitamente: "¿Tienes alguna nota especial o detalle para este piso (ej. color, textura, decoración)?". ⚠️ ESTÁ ESTRICTAMENTE PROHIBIDO SALTARTE ESTA PREGUNTA. DEBES esperar la respuesta del cliente antes de avanzar.
  
B. BUCLE DE COMPLEMENTARIOS (DESGLOSADO ESTRICTAMENTE):
- Si dice que SÍ quiere complementarios, PREGUNTA PRIMERO: "¿Cuántos pasteles extra o planchas vas a necesitar? (Te comento que el máximo permitido es de 3)".
- ⚠️ LÍMITE DE COMPLEMENTARIOS: Si pide más de 3, rechaza la solicitud amablemente indicando el límite y dale a elegir: "¿Te gustaría ajustarlo a nuestro máximo de 3 pasteles extra, continuar únicamente con tu pastel principal, o prefieres cancelar el pedido?".
   - Si decide ajustarse a 3 o menos, continúa.
   - Si decide continuar SOLO con el principal, omite los complementarios y pasa al siguiente paso (Imágenes/Entrega).
   - Si decide cancelar, despídete amablemente, confirma la cancelación y finaliza el proceso.
- ⚠️ ATAJO DE COPIA (A partir del segundo pastel extra): Al terminar un pastel extra y empezar el siguiente, DEBES preguntar OBLIGATORIAMENTE: "¿Te gustaría que este pastel extra sea exactamente igual al anterior o prefieres elegir características diferentes?".
  * Si el cliente dice "Igual" o "Todos iguales": Copia internamente los datos del pastel extra anterior y pasa al siguiente (o al paso de Imágenes si ya terminó).
  * Si el cliente dice "Diferente": Hazle las 5 preguntas de abajo.
- Para el PRIMER pastel extra (o si eligen detallar diferente), pregunta ESTRICTAMENTE UNO POR UNO:
  1. ¿Qué tamaño tendrá? (Menciona solo: ${catalogContext.sizesComplementario}. Muestra precios extra si tienen).
  2. ¿Qué forma tendrá? (Menciona solo: ${catalogContext.shapesComplementario}).
  3. Pan (Muestra opciones y pregunta cuáles, aplicando la REGLA DE ESCASEZ).
  4. Relleno (Muestra opciones y pregunta cuáles, aplicando la REGLA DE ESCASEZ).
  5. Detalles o descripción (color, liso, texto, etc.).

C. IMÁGENES DE REFERENCIA:
- Cuando te manden fotos, agradece cada foto con 📸. Cuando diga "Listo/No", continúa.

REGLA 7 (JSON ESTRICTO Y TRADUCIDO PARA EL SISTEMA):
Usa este formato exacto. 
ESTRICTAMENTE IMPORTANTE: Usa las palabras exactas para las llaves.
⚠️ REGLA DE PRECIOS EN BD: En los campos de arreglos ("sabores_pan", "rellenos") y en "forma", DEBES guardar el texto EXACTAMENTE como aparece en el catálogo, INCLUYENDO EL PRECIO EXTRA.
LA HORA DEBE SER ESTRICTAMENTE EN FORMATO 24 HORAS (Ejemplo: "14:00", "09:30"). PROHIBIDO usar "AM/PM" o la palabra "hrs" dentro del JSON.

[CREAR_FOLIO_AHORA]
{
  "cliente_nombre": "Nombre del cliente",
  "cliente_telefono": "Número principal a 10 dígitos (Si el cliente dijo 'este mismo', DEBES poner null para que el sistema use su WhatsApp)",
  "cliente_telefono_extra": "Número adicional a 10 dígitos (o null si no dio ninguno)",
  "numero_personas": 10,
  "forma": "Redondo",
  "tipo_folio": "Base/Especial", // ⚠️ IMPORTANTE: Si es de 1 solo piso pon "Normal", pero si el pastel tiene varios pisos DEBES poner estrictamente "Base/Especial".
  "sabores_pan": ["Sabor 1", "Sabor 2"],
  "rellenos": ["Sabor 1", "Sabor 2"],
  "detallesPisos": [
     { "personas": 20, "panes": ["Sabor"], "rellenos": ["Sabor"], "notas": "Forma cuadrada, color rojo" }
  ],
  "complementarios": [
     { "persons": 30, "shape": "Plancha", "flavor": "Sabor 1, Sabor 2", "filling": "Sabor", "description": "Liso en azul" }
  ],
  "descripcion_diseno": "Texto descriptivo",
  "dedicatoria": "Texto de la dedicatoria (o null)",
  "is_delivery": false,
  "calle": "Nombre de la calle (o null si es en sucursal)",
  "colonia": "Nombre de la colonia (o null si es en sucursal)",
  "ubicacion_entrega": "Indicaciones extra o 'Recoger en Sucursal'",
  "fecha_entrega": "YYYY-MM-DD",
  "hora_entrega": "HH:mm"
}
`;

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