const OpenAI = require('openai');
// 1. IMPORTAMOS LOS MODELOS DE LA BASE DE DATOS
const { Flavor, Filling } = require('../models');

// La clave de la API se carga automáticamente desde las variables de entorno (process.env.OPENAI_API_KEY)
let openai;

// --- MOCK DATA (DATOS FALSOS PARA PRUEBAS SIN KEY) ---
// --- ARREGALDO: Ahora las llaves coinciden con las que espera whatsapp.controller.js ---
const MOCK_EXTRACTION = {
    folioType: "Normal",
    nombre: "Cliente de Prueba (Sin IA)",
    fecha_entrega: "2025-10-30",
    hora_entrega: "14:00",
    numero_personas: 20,
    sabor_pan: "Chocolate",
    relleno: "Fresa",
    diseno: "Pastel de prueba generado automáticamente porque no hay API Key.",
    dedicatoria: null,
    requiere_envio: false,
    calle: null,
    colonia: null,
    referencias: null,
    tiers: [],
    complements: [],
    additional: []
};


function getOpenAIClient() {
    if (!openai) {
        if (!process.env.OPENAI_API_KEY) {
            throw new Error('OPENAI_API_KEY is not set in environment variables.');
        }
        openai = new OpenAI();
    }
    return openai;
}

async function getInitialExtraction(conversationText) {
    // 1. DETECTOR DE MODO SIMULACIÓN
    if (!process.env.OPENAI_API_KEY) {
        console.log("⚠️ [MODO SIMULACIÓN] No hay OPENAI_API_KEY. Usando datos falsos.");
        // Simulamos una pequeña espera para que parezca real
        await new Promise(resolve => setTimeout(resolve, 1000));
        return MOCK_EXTRACTION;
    }


    const today = new Date().toLocaleDateString('es-MX', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });

    // 2. OBTENER DATOS FRESCOS DE LA BASE DE DATOS
    let flavorsTxt = "Cualquiera mencionado en el texto";
    let fillingsTxt = "Cualquiera mencionado en el texto";

    try {
        // Consultamos solo los activos
        const dbFlavors = await Flavor.findAll({ where: { isActive: true } });
        const dbFillings = await Filling.findAll({ where: { isActive: true } });

        // Convertimos a string separado por comas para el Prompt
        if (dbFlavors.length > 0) {
            flavorsTxt = dbFlavors.map(f => f.name).join(', ');
        }
        if (dbFillings.length > 0) {
            fillingsTxt = dbFillings.map(f => f.name).join(', ');
        }
        console.log("📝 Catálogos cargados para IA:", { flavorsCount: dbFlavors.length, fillingsCount: dbFillings.length });

    } catch (dbError) {
        console.error("⚠️ Advertencia: No se pudieron cargar los catálogos de la BD para la IA. Se continuará sin ellos.", dbError.message);
        // No lanzamos error fatal para que el servicio siga funcionando aunque falle la BD momentáneamente
    }

    // ===== PROMPT ACTUALIZADO CON DATOS DINÁMICOS Y NUEVAS LLAVES =====
    const prompt = `
        Eres un asistente experto para una pastelería llamada "La Fiesta". Tu tarea es analizar la siguiente conversación de WhatsApp
        y extraer la información clave para generar un folio de pedido en formato JSON. La fecha de hoy es ${today}.

        **CONTEXTO DEL MENÚ (IMPORTANTE):**
        Para los campos de \`sabor_pan\` (Sabor Pan) y \`relleno\` (Relleno), intenta ajustar lo que dice el usuario a las siguientes listas oficiales. Si el usuario dice algo muy similar (ej. "Choco" en vez de "Chocolate"), usa el nombre oficial. Si pide algo totalmente diferente que no está en la lista, respeta el texto original del usuario.
        
        * **LISTA DE SABORES DE PAN OFICIALES:** ${flavorsTxt}
        * **LISTA DE RELLENOS OFICIALES:** ${fillingsTxt}

        **Instrucciones Generales:**
        1.  **Analiza la conversación:** Lee todo el texto para entender los detalles del pedido.
        2.  **Interpreta fechas y horas:** Convierte fechas relativas (ej. "mañana", "el próximo lunes") a formato AAAA-MM-DD. Convierte horas a formato HH:MM:SS de 24 horas.
        3.  **Formato de Salida:** Responde únicamente con un objeto JSON válido, sin ningún texto adicional antes o después.

        **Instrucciones Específicas para Tipo de Folio y Estructura:**
        1.  **Detecta el Tipo de Folio:**
            * Si la conversación menciona explícitamente "pisos", "bases", "pastel especial", "de base", o describe claramente diferentes secciones/pisos del pastel con distintas características (personas, panes, rellenos por sección), establece \`folioType\` como \`"Base/Especial"\`.
            * En cualquier otro caso, establece \`folioType\` como \`"Normal"\`.
        2.  **Extrae Datos según el Tipo:**
            * **Si es "Normal":**
                * Extrae el sabor general en \`sabor_pan\`.
                * Extrae el relleno general en \`relleno\`.
                * Deja el campo \`tiers\` como \`null\` o un array vacío \`[]\`.
            * **Si es "Base/Especial":**
                * **Deja los campos \`sabor_pan\` y \`relleno\` como \`null\`**. La información irá en \`tiers\`.
                * Analiza la descripción de cada piso **ESTRUCTURAL (APILADO)** y crea un array de objetos en el campo \`tiers\`. **NO incluyas planchas o pasteles de complemento aquí.**
                * Cada objeto dentro de \`tiers\` DEBE tener la siguiente estructura exacta:
                    \`\`\`
                    {
                      "persons": number,      // Personas para ESE piso
                      "panes": [string, string, string], // Intenta extraer 3 sabores de pan para el piso. Si solo mencionan uno, repítelo 3 veces. Si mencionan dos, añade el primero de nuevo al final. Si no mencionan, usa [null, null, null].
                      "rellenos": [string, string], // Intenta extraer 2 rellenos para el piso. Si solo mencionan uno, añádelo y pon el segundo como null. Si no mencionan o no aplica (ej. pan queso), usa [null, null].
                      "notas": string | null  // Notas adicionales o forma específica del piso (opcional)
                    }
                    \`\`\`
                * Asegúrate de que \`numero_personas\` en el nivel raíz del JSON siga siendo el número total de personas para todo el pedido (la suma de las personas de los pisos si está disponible, o el total mencionado).

        **Reglas Adicionales:**
        * **Dedicatoria:** Si encuentras frases como "que diga '...'", "con el texto '...'", o una frase entre comillas que deba ir en el pastel, extrae ese texto EXCLUSIVAMENTE en el campo \`dedicatoria\`. NO incluyas la dedicatoria en \`diseno\`.
        * **Dirección/Envío:** Si el cliente pide envío a domicilio, establece \`requiere_envio\` en true y llena \`calle\`, \`colonia\` y \`referencias\`. Si pasa a sucursal, pon \`requiere_envio\` en false.

        **Campos a extraer (adapta según el folioType detectado):**
        - \`folioType\`: (String) "Normal" o "Base/Especial". **Obligatorio**.
        - \`nombre\`: (String | null) Nombre del cliente.
        - \`fecha_entrega\`: (String | null) Fecha de entrega (YYYY-MM-DD).
        - \`hora_entrega\`: (String | null) Hora de entrega (HH:MM:SS).
        - \`numero_personas\`: (Number | null) Número TOTAL de personas para el pedido completo. **Obligatorio**.
        - \`sabor_pan\`: (String | null) Sabor general del pan (SOLO para tipo "Normal").
        - \`relleno\`: (String | null) Relleno general (SOLO para tipo "Normal").
        - \`tiers\`: (Array of Objects | null) Estructura por pisos **APILADOS** (SOLO para tipo "Base/Especial"). **NO incluir planchas aquí.** Sigue la estructura definida arriba.
        - \`diseno\`: (String | null) Descripción detallada de la decoración (SIN dedicatoria).
        - \`dedicatoria\`: (String | null) Texto de la dedicatoria.
        - \`requiere_envio\`: (Boolean) true si es a domicilio, false si recoge.
        - \`calle\`: (String | null) Calle y número.
        - \`colonia\`: (String | null) Colonia.
        - \`referencias\`: (String | null) Referencias del domicilio.
        - \`complements\`: (Array of Objects | null) Array de pasteles ADICIONALES (planchas, quequitos) que complementan el pedido. **NO SON LOS PISOS DEL PASTEL PRINCIPAL.**
            * \`\`\`
                {
                  "persons": number | null,   // Personas para ESE complemento
                  "shape": string | null,     // Forma (ej. "Plancha")
                  "flavor": string | null,    // Sabor del pan
                  "filling": string | null,   // Relleno
                  "description": string | null // Decoración o notas
                }
                \`\`\`
        - \`additional\`: (Array of Objects | null) Adicionales con costo (ej. velas, letreros). Estructura: \`[{ "name": "Cant x Producto", "price": number }]\`.

        **Conversación a analizar:**
        ---
        ${conversationText}
        ---
    `;

    try {
        console.log("🤖 Iniciando extracción inicial con IA...");
        const client = getOpenAIClient();
        const response = await client.chat.completions.create({
            model: "gpt-4o", // Usamos gpt-4o por su mejor capacidad para seguir instrucciones complejas y estructurar JSON
            messages: [{ role: "system", content: prompt }],
            response_format: { type: "json_object" }, // Forzar salida JSON
        });

        const extractedJsonString = response.choices[0].message.content;
        console.log("🤖 Datos extraídos por la IA (Extracción Inicial - Raw):", extractedJsonString);

        // Validación básica antes de parsear
        if (!extractedJsonString || !extractedJsonString.trim().startsWith('{') || !extractedJsonString.trim().endsWith('}')) {
            console.error("Respuesta inválida de OpenAI:", extractedJsonString);
            throw new Error("La respuesta de la IA no fue un objeto JSON válido.");
        }

        let extractedData;
        try {
            extractedData = JSON.parse(extractedJsonString);
        } catch (parseError) {
            console.error("Error al parsear JSON de OpenAI:", parseError, "JSON recibido:", extractedJsonString);
            throw new Error(`Error al interpretar la respuesta de la IA: ${parseError.message}`);
        }


        // --- Validaciones y Aseguramiento de Tipos ---
        const requiredKeys = ['folioType', 'numero_personas', 'fecha_entrega']; // Campos mínimos esperados
        for (const key of requiredKeys) {
            if (!(key in extractedData) || extractedData[key] === null || extractedData[key] === undefined) {
                console.warn(`Advertencia: La IA no extrajo el campo obligatorio '${key}'. Se intentará continuar, pero puede causar errores.`);
            }
        }

        // Asegurar que 'numero_personas' sea un número
        if (extractedData.numero_personas && typeof extractedData.numero_personas !== 'number') {
            const parsedPersons = parseInt(extractedData.numero_personas, 10);
            extractedData.numero_personas = !isNaN(parsedPersons) ? parsedPersons : null;
        }

        // Asegurar que folioType sea uno de los valores permitidos, si no, default a Normal
        if (!['Normal', 'Base/Especial'].includes(extractedData.folioType)) {
            console.warn(`folioType inválido ('${extractedData.folioType}') recibido de la IA. Se usará 'Normal' por defecto.`);
            extractedData.folioType = 'Normal';
        }

        // Limpieza condicional basada en folioType (asegurar consistencia)
        if (extractedData.folioType === 'Base/Especial') {
            extractedData.sabor_pan = null;
            extractedData.relleno = null;
            if (!Array.isArray(extractedData.tiers)) {
                console.warn("folioType es Base/Especial pero 'tiers' no es un array. Se establecerá a [].");
                extractedData.tiers = [];
            }
        } else { // Si es 'Normal'
            extractedData.tiers = null; // O []
            // Aseguramos que sabor_pan y relleno vengan como string o null
            if (typeof extractedData.sabor_pan !== 'string') extractedData.sabor_pan = null;
            if (typeof extractedData.relleno !== 'string') extractedData.relleno = null;
        }

        // --- INICIO CORRECCIÓN: Asegurar que los arrays existan ---
        if (!Array.isArray(extractedData.complements)) extractedData.complements = [];
        if (!Array.isArray(extractedData.additional)) extractedData.additional = [];
        // --- FIN CORRECCIÓN ---

        // Validar booleano
        if (typeof extractedData.requiere_envio !== 'boolean') {
            extractedData.requiere_envio = extractedData.requiere_envio === 'true' || extractedData.requiere_envio === true;
        }

        console.log("✅ Datos extraídos y procesados:", JSON.stringify(extractedData, null, 2));
        return extractedData;

    } catch (error) {
        console.error("❌ Error en getInitialExtraction:", error);
        throw new Error(`Error durante la extracción inicial con IA: ${error.message}`);
    }
}

module.exports = { getInitialExtraction };