require('dotenv').config();
const OpenAI = require('openai');
const { CakeFlavor, Filling, CakeShape } = require('../models');

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
      description: "¡IMPORTANTE! Usa esta herramienta para CREAR un nuevo pedido o modificar el actual. DEBES llamarla INMEDIATAMENTE en cuanto el usuario te dé cualquier dato. NUNCA preguntes por datos faltantes antes de usar esta herramienta. Extrae lo que haya y guárdalo.",
      parameters: {
        type: "object",
        properties: {
          updates: {
            type: "object",
            description: "Objeto JSON con los campos a actualizar. Ejemplos: {'clientName': 'Ana'}, {'tiers': [...]}, {'complements': [...]}, {'additional': [{'name': '1 x Vela', 'price': 35.00}]}",
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
      description: "Finaliza la conversación y crea el folio oficial con los datos actuales.",
      parameters: { /* Sin parámetros */ },
    },
  },
  {
    type: "function",
    function: {
      name: "answer_question_from_context",
      description: "Responde a una pregunta directa del usuario basándote únicamente en el historial de la conversación.",
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

  const tenantId = session.tenantId || 1; 
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

  const systemPrompt = `
    Eres un EXTRACTOR DE DATOS SILENCIOSO para Pastelería La Fiesta. No eres un chatbot conversacional tradicional.
    Tu ÚNICO objetivo es escuchar al usuario y ejecutar la herramienta 'update_folio_data' para llenar el JSON del pedido.

    **REGLA DE ORO (CERO PREGUNTAS):**
    ESTÁ ESTRICTAMENTE PROHIBIDO pedirle datos al usuario o decirle "por favor proporciona los demás datos...". 
    Si el usuario te da 1 solo dato o te da 50 datos de golpe, TU OBLIGACIÓN ABSOLUTA es extraer todo lo que puedas y llamar a la herramienta \`update_folio_data\` INMEDIATAMENTE. No importa si faltan cosas en el texto, extrae y guarda lo que haya.

    **INVENTARIO ACTIVO DISPONIBLE:**
    Solo puedes añadir (en \`cakeFlavor\`, \`filling\`, \`shape\`, \`tiers\` o \`complements\`) estas opciones:
    - Sabores de Pan: ${catalogContext.flavors}
    - Sabores de Relleno: ${catalogContext.fillings}
    - Formas Principal: ${catalogContext.shapesPrincipal}
    - Formas Complementarios: ${catalogContext.shapesComplementario}
    Si pide algo que no está aquí, NO lo agregues a la herramienta y en tu mensaje de confirmación dile que no está disponible.

    **FLUJO DE TRABAJO:**
    1. El usuario envía texto.
    2. TU PRIMERA RESPUESTA DEBE SER LA LLAMADA A LA HERRAMIENTA \`update_folio_data\`.
    3. El sistema te devuelve el resultado (\`role: 'tool'\`).
    4. TU SEGUNDA RESPUESTA DEBE SER una confirmación corta: "¡Listo! Datos capturados." NO hagas más preguntas.

    **REGLAS CLAVE PARA \`update_folio_data\`:**
    * **Pisos:** Instrucciones sobre "pisos" o "bases" van al array \`tiers\` (SOLO si \`folioType\` es "Base/Especial").
    * **Complementos:** Instrucciones sobre "complemento", "plancha adicional" van al array \`complements\`.
    * **Costos Extra:** Velas, toppers, envíos, van al array \`additional\` con su precio.
    * **Fechas:** Convierte fechas relativas al formato YYYY-MM-DD. Año actual: ${new Date().getFullYear()}.

    **ESTRUCTURA DE DATOS PERMITIDA:**
    * \`clientName\`: string
    * \`clientPhone\`: string
    * \`clientPhone2\`: string | null
    * \`deliveryDate\`: string (YYYY-MM-DD)
    * \`deliveryTime\`: string (HH:mm)
    * \`persons\`: number
    * \`shape\`: string
    * \`folioType\`: "Normal" | "Base/Especial"
    * \`cakeFlavor\`: array[string]
    * \`filling\`: array[{name: string, hasCost: boolean}]
    * \`tiers\`: array[{persons: number, panes: [string|null], rellenos: [string|null], notas: string | null}]
    * \`designDescription\`: string
    * \`dedication\`: string | null
    * \`deliveryLocation\`: string
    * \`deliveryCost\`: number | null
    * \`total\`: number | null
    * \`advancePayment\`: number | null
    * \`isPaid\`: boolean
    * \`hasExtraHeight\`: boolean
    * \`accessories\`: string | null
    * \`additional\`: array[{name: string, price: number}]
    * \`complements\`: array[{persons: number | null, shape: string | null, flavor: string | null, filling: string | null, description: string | null}]

    **Estado Actual:**
    ${JSON.stringify(session.extractedData, null, 2)}
`;

  let messages = [
    { role: "system", content: systemPrompt },
    ...(session.chatHistory || []) 
  ];

  if (userMessage) {
    messages.push({ role: "user", content: userMessage });
  }

  console.log("🤖 Historial enviado a OpenAI (últimos 3):", JSON.stringify(messages.slice(-3), null, 2));

  try {
    const client = getOpenAIClient();
    const response = await client.chat.completions.create({
      model: "gpt-4o",
      messages: messages,
      tools: tools,
      tool_choice: "auto",
    });

    return response.choices[0].message;

  } catch (error) {
    console.error("❌ Error llamando a OpenAI:", error);
    return {
      role: 'assistant',
      content: `Hubo un error al procesar tu solicitud con la IA: ${error.message}`
    };
  }
};