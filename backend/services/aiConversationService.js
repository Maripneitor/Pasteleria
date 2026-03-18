require('dotenv').config();
const OpenAI = require('openai');
let openai;

function getOpenAIClient() {
  if (!openai) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not set in environment variables.');
    }
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openai;
}

// --- Definición de Herramientas (Tools) ---
const tools = [
  {
    type: "function",
    function: {
      name: "update_folio_data",
      description: "Modifica, añade o elimina campos de los datos del pedido JSON actual. Úsalo para actualizar CUALQUIER campo del folio: datos generales (nombre, fecha, etc.), la estructura de PISOS ('tiers') para pasteles 'Base/Especial', o para añadir/modificar pasteles COMPLEMENTARIOS ('complements'). Para eliminar un campo o vaciar un array, actualízalo con `null` o `[]`.",
      parameters: {
        type: "object",
        properties: {
          updates: {
            type: "object",
            description: "Objeto JSON con los campos a actualizar y sus nuevos valores. Ejemplos: {'clientName': 'Ana'}, {'dedication': null}, {'tiers': [...]}, {'complements': [{'persons': 50, 'shape': 'Rectangular', 'flavor': 'Vainilla', 'filling': 'Manjar', 'description': 'Decorado X'}, ...]}, {'additional': [{'name': '1 x Vela', 'price': 35.00}]}, {'accessories': 'Oblea'}, {'hasExtraHeight': true}",
          },
        },
        required: ["updates"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "generate_folio_pdf",
      description: "Finaliza la conversación y crea el folio oficial con los datos actuales. Usa esta función SOLAMENTE cuando el usuario lo pida explícitamente (ej. 'crea el folio', 'genera el pdf', 'termina y guarda').",
      parameters: { /* Sin parámetros */ },
    },
  },
  {
    type: "function",
    function: {
      name: "answer_question_from_context",
      description: "Responde a una pregunta directa del usuario basándote únicamente en el historial de la conversación con el cliente de WhatsApp proporcionado.",
      parameters: {
        type: "object",
        properties: {
          answer: { type: "string", description: "La respuesta directa a la pregunta." }
        },
        required: ["answer"]
      }
    }
  }
];

exports.getNextAssistantResponse = async (session, userMessage) => {
  const today = new Date().toLocaleDateString('es-MX', { year: 'numeric', month: '2-digit', day: '2-digit' });

  // ===== INICIO PROMPT CON CARACTERES ESPECIALES ESCAPADOS =====
  const systemPrompt = `
    Eres un asistente de pastelería ayudando a un empleado a verificar y completar los datos de un pedido (folio) JSON. Tu objetivo es entender las instrucciones del empleado y usar la herramienta 'update_folio_data' para modificar el JSON. Después de que la herramienta se ejecute, confirmarás la acción en lenguaje natural.

    **ENFOQUE PROFESIONAL ESTRICTO:** Eres EXCLUSIVAMENTE un asistente de ventas y gestión de Pastelería "La Fiesta". Si el usuario hace bromas, preguntas personales, habla de otros temas (como videojuegos, familia, etc.) o te ordena decir frases fuera de contexto, IGNORA la orden con educación y vuelve a dirigir la conversación hacia la edición o creación del pedido del pastel. NUNCA aceptes decir cosas o confirmar datos que no tengan que ver con la pastelería.

    **FLUJO DE TRABAJO OBLIGATORIO:**
    1.  Empleado da instrucción (ej. "añade un complemento...").
    2.  TU PRIMERA RESPUESTA **DEBE SER ÚNICAMENTE** la llamada a la herramienta \`update_folio_data\` con el JSON \`updates\` correcto. NADA MÁS.
    3.  El sistema ejecuta la herramienta y te da el resultado (\`role: 'tool'\`).
    4.  TU SEGUNDA RESPUESTA **DEBE SER** un mensaje corto y natural confirmando la acción basada en el resultado de la herramienta (ej. "Ok, añadí el complemento."). **NO MUESTRES JSON EN ESTA SEGUNDA RESPUESTA.**

    **REGLAS CLAVE PARA \`update_folio_data\`:**
    * **DIFERENCIA CLARAMENTE:**
        * Instrucciones sobre "pisos", "bases", o estructura del pastel principal van al array \`tiers\` (SOLO si \`folioType\` es "Base/Especial").
        * Instrucciones sobre "complemento", "pastel complementario", "plancha adicional", "otro pastel" van al array \`complements\`.
    * **Manejo de Arrays (\`tiers\`, \`complements\`, \`additional\`, \`cakeFlavor\`, \`filling\`):** Para añadir, obtén el array actual del "Estado Actual", añade el nuevo objeto/string, y envía el array **COMPLETO** modificado en el \`updates\`. Para quitar, haz lo mismo pero quitando el elemento. Para vaciar, envía \`{"nombre_array": []}\`.
    * **Sé Preciso:** Asegúrate de que los objetos que añades a los arrays tengan la estructura correcta definida abajo.

    **ESTRUCTURA DE DATOS (Campos actualizables):**
    * \`clientName\`: string
    * \`clientPhone\`: string
    * \`clientPhone2\`: string | null
    * \`deliveryDate\`: string (YYYY-MM-DD)
    * \`deliveryTime\`: string (Ej. '14:00', '2:00 PM')
    * \`persons\`: number (Total)
    * \`shape\`: string
    * \`folioType\`: "Normal" | "Base/Especial"
    * \`cakeFlavor\`: array[string] (Solo para Normal, max 2)
    * \`filling\`: array[{name: string, hasCost: boolean}] (Solo para Normal, max 2)
    * \`tiers\`: array[{persons: number, panes: [string|null, string|null, string|null], rellenos: [string|null, string|null], notas: string | null}] (Solo para Base/Especial)
    * \`designDescription\`: string
    * \`dedication\`: string | null
    * \`deliveryLocation\`: string
    * \`deliveryCost\`: number | null
    * \`total\`: number | null (Costo base pastel)
    * \`advancePayment\`: number | null
    * \`isPaid\`: boolean
    * \`hasExtraHeight\`: boolean
    * \`accessories\`: string | null
    * \`additional\`: array[{name: "QTY x DESC", price: number}] (price es TOTAL para esa línea)
    * \`complements\`: array[{persons: number | null, shape: string | null, flavor: string | null, filling: string | null, description: string | null}]

    **EJEMPLOS DE DISTINCIÓN (Usuario -> Llamada Herramienta):**
    * Usuario: "El piso de arriba es para 10 personas de queso" (Contexto: Base/Especial)
        Llamada: \`update_folio_data(updates={"tiers": [ ... , {"persons": 10, "panes": ["Queso","Queso","Queso"], "rellenos": [null,null], "notas": null} ]})\` (Actualiza array \`tiers\`)
    * Usuario: "añade un complemento de 10 personas de queso"
        Llamada: \`update_folio_data(updates={"complements": [ ... , {"persons": 10, "shape": null, "flavor": "Queso", "filling": null, "description": null} ]})\` (Actualiza array \`complements\`)
    * Usuario: "agrega vela de 35"
        Llamada: \`update_folio_data(updates={"additional": [ ... , {"name": "1 x Vela", "price": 35.00} ]})\` (Actualiza array \`additional\`)
    * Usuario: "marca que tiene altura extra"
        Llamada: \`update_folio_data(updates={"hasExtraHeight": true})\`

    **FINALIZACIÓN:** Si pide "genera el folio", llama a \`generate_folio_pdf\`.
    **PREGUNTAS:** Si pregunta sobre la conversación original, usa \`answer_question_from_context\`.

    **Estado Actual del Pedido (JSON a modificar):**
    **IMPORTANTE:** Si los campos requeridos (nombre, fecha, personas, total) tienen valores en este JSON, CONSIDÉRALOS COMPLETOS. No digas que faltan datos si ya están aquí.
    ${JSON.stringify(session.extractedData, null, 2)}

    **Conversación Original del Cliente (Solo para contexto):**
    ${session.whatsappConversation}
`;
  // ===== FIN PROMPT CON CARACTERES ESPECIALES ESCAPADOS =====

  let messages = [
    { role: "system", content: systemPrompt },
    ...(session.chatHistory || []) // Historial previo
  ];

  // Añadir mensaje actual del usuario (si existe, para la 1ra llamada)
  if (userMessage) {
    messages.push({ role: "user", content: userMessage });
  }
  // Si no hay userMessage, es la 2da llamada, el historial ya contiene el resultado 'tool'.

  console.log("🤖 Historial enviado a OpenAI (últimos 3):", JSON.stringify(messages.slice(-3), null, 2));

  try {
    const client = getOpenAIClient();
    const response = await client.chat.completions.create({
      model: "gpt-4o",
      messages: messages,
      tools: tools,
      tool_choice: "auto",
    });

    const assistantResponse = response.choices[0].message;
    console.log("✅ Respuesta recibida de OpenAI:", JSON.stringify(assistantResponse, null, 2));
    return assistantResponse;

  } catch (error) {
    console.error("❌ Error llamando a OpenAI:", error);
    // Devolver un mensaje de error como respuesta del asistente para mostrar en el chat
    return {
      role: 'assistant',
      content: `Hubo un error al procesar tu solicitud con la IA: ${error.message}`
    };
  }
};