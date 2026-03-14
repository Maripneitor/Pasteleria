const { OpenAI } = require('openai');
const fs = require('fs');
const path = require('path');

// Initialize OpenAI client if key exists
const openai = process.env.OPENAI_API_KEY ? new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
}) : null;

/**
 * Service to handle Draft Generation
 */
const aiDraftService = {

    async processDraft(prompt) {
        if (!prompt) throw new Error("Prompt required");

        // Strategy Pattern: Choose implementation
        if (openai) {
            return await this._generateWithOpenAI(prompt);
        } else {
            return this._generateFallback(prompt);
        }
    },

    async _generateWithOpenAI(prompt) {
        try {
            // Le damos la fecha actual a la IA para que asigne el año y mes correctos
            const hoy = new Date().toLocaleDateString('es-MX');
            
            const completion = await openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [
                    {
                        role: "system",
                        content: `Eres un asistente de pastelería inteligente.
                        Tu trabajo es extraer detalles de pedidos del texto del usuario y devolver ONLY JSON válido.
                        No incluyas markdown.
                        Hoy es ${hoy}. Usa el año actual o el próximo para las fechas si no se especifica el año exacto.
                        
                        Schema esperado:
                        {
                            "draft": {
                                "clientName": string | "",
                                "clientPhone": string | "",
                                "deliveryDate": "YYYY-MM-DD" | "",
                                "deliveryTime": "HH:mm" | "",
                                "products": [
                                    { "flavor": string, "filling": string, "design": string, "notes": string }
                                ],
                                "notesRaw": string, // El prompt original o notas adicionales
                                "summary": string // Resumen de 1 linea
                            },
                            "missing": string[], 
                            "nextQuestion": string
                        }`
                    },
                    { role: "user", content: prompt }
                ],
                temperature: 0.2,
            });

            const content = completion.choices[0].message.content;
            const cleanJson = content.replace(/```json/g, '').replace(/```/g, '').trim();
            const parsedData = JSON.parse(cleanJson);

            return {
                ...parsedData,
                mode: 'openai'
            };

        } catch (error) {
            console.error("OpenAI Service Error:", error);
            throw error;
        }
    },

    async processEdit(orderData, instruction) {
        if (!openai) throw new Error("OpenAI API Key no configurada.");

        try {
            const hoy = new Date().toLocaleDateString('es-MX');
            const completion = await openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [
                    {
                        role: "system",
                        content: `Eres un asistente de pastelería inteligente.
                        Recibirás un JSON con los datos actuales de un pedido y una instrucción del cliente para modificarlo. Hoy es ${hoy}.
                        Debes devolver ONLY JSON válido con los campos exactos de la base de datos que deben actualizarse.
                        No incluyas markdown.
                        
                        Schema esperado:
                        {
                            "updates": {
                                // Ej: "sabores_pan": ["vainilla"], "fecha_entrega": "2024-11-20"
                            },
                            "summary": "Resumen de 1 linea de los cambios realizados."
                        }`
                    },
                    {
                        role: "user",
                        content: `DATOS ACTUALES:\n${JSON.stringify(orderData)}\n\nINSTRUCCIÓN: ${instruction}`
                    }
                ],
                temperature: 0.1, // Baja temperatura porque queremos precisión, no creatividad
            });

            const content = completion.choices[0].message.content;
            const cleanJson = content.replace(/```json/g, '').replace(/```/g, '').trim();
            return JSON.parse(cleanJson);

        } catch (error) {
            console.error("OpenAI Edit Error:", error);
            throw new Error("No se pudo procesar la edición del pedido.");
        }
    },

    async processSearch(searchQuery) {
        if (!openai) throw new Error("OpenAI API Key no configurada.");

        try {
            const hoy = new Date().toLocaleDateString('es-MX');
            const completion = await openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [
                    {
                        role: "system",
                        content: `Eres un analista de datos para una pastelería. Hoy es ${hoy}.
                        Tu objetivo es extraer los filtros de búsqueda de la frase del usuario.
                        Devuelve ONLY JSON válido, sin markdown.
                        
                        REGLA IMPORTANTE PARA "q": Debe ser una palabra clave MUY CORTA. 
                        Omite artículos, plurales o palabras como "busca", "los", "pasteles", "de", "con". 
                        Si te dicen "busca los pasteles de chocolate", q debe ser "chocolate".
                        Si te dicen "pedidos a nombre de Carlos", q debe ser "Carlos".
                        
                        Schema esperado:
                        {
                            "filters": {
                                "q": "string (Palabra clave ultra corta) o vacío si solo menciona fechas",
                                "startDate": "YYYY-MM-DD" | null,
                                "endDate": "YYYY-MM-DD" | null,
                                "status": "Pendiente" | "Entregado" | "Cancelado" | null
                            },
                            "summary": "Un mensaje amigable de 1 línea. Ej: 'Buscando pedidos de chocolate...'"
                        }`
                    },
                    {
                        role: "user",
                        content: searchQuery
                    }
                ],
                temperature: 0.1, 
            });

            const content = completion.choices[0].message.content;
            const cleanJson = content.replace(/```json/g, '').replace(/```/g, '').trim();
            return JSON.parse(cleanJson);

        } catch (error) {
            console.error("OpenAI Search Error:", error);
            throw new Error("No se pudo procesar la búsqueda inteligente.");
        }
    },

    async analyzeImage(imageUrl) {
        if (!openai) throw new Error("OpenAI API Key no configurada.");
        try {
            // imageUrl llega como "/uploads/reference/xxxxx.jpg"
            const localPath = path.join(__dirname, '../../', imageUrl);
            
            if (!fs.existsSync(localPath)) {
                throw new Error("La imagen no existe en el servidor.");
            }

            const imageAsBase64 = fs.readFileSync(localPath, 'base64');
            const extension = path.extname(localPath).replace('.', '') || 'jpeg';
            const mimeType = extension === 'png' ? 'image/png' : extension === 'webp' ? 'image/webp' : 'image/jpeg';
            const dataUri = `data:${mimeType};base64,${imageAsBase64}`;

            const completion = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [
                    {
                        role: "system",
                        content: "Eres un asistente experto en diseño de pasteles. Analiza la imagen y describe detalladamente: colores principales, la temática, la estructura (si es de pisos), adornos (fondant, texturas, perlas, personajes). Esta descripción servirá para que un pastelero pueda replicarlo."
                    },
                    {
                        role: "user",
                        content: [
                            { type: "text", text: "Analiza el diseño de este pastel detalladamente." },
                            { type: "image_url", image_url: { url: dataUri } }
                        ]
                    }
                ],
                max_tokens: 300,
            });
            
            return { description: completion.choices[0].message.content };
        } catch (error) {
            console.error("OpenAI Image Analysis Error:", error);
            throw new Error("No se pudo analizar la imagen.");
        }
    },

    /**
     * LOCAL FALLBACK PARSER (Regex/Heuristic)
     */
    _generateFallback(prompt) {
        console.log("⚠️ Using Fallback Parser for Draft");

        const draft = {
            clientName: "",
            clientPhone: "",
            deliveryDate: "",
            deliveryTime: "",
            products: [{
                flavor: "",
                filling: "",
                design: "",
                notes: ""
            }],
            notesRaw: prompt,
            summary: "Borrador generado automáticamente (Sin IA)."
        };

        const missing = ["Verificar fecha/hora", "Confirmar sabor/relleno"];

        // --- 1. Extract Date (Simple Heuristics) ---
        const dateMatch = prompt.match(/\d{4}-\d{2}-\d{2}/);
        if (dateMatch) draft.deliveryDate = dateMatch[0];

        // --- 2. Extract Time ---
        const timeMatch = prompt.match(/(\d{1,2})(:(\d{2}))?\s*(am|pm|hrs)?/i);
        if (timeMatch) {
            draft.deliveryTime = timeMatch[0];
        }

        // --- 3. Extract Phone ---
        const phoneMatch = prompt.match(/\b\d{10}\b/);
        if (phoneMatch) draft.clientPhone = phoneMatch[0];

        // --- 4. Guess Name ---
        const nameMatch = prompt.match(/(?:cliente|nombre|a nombre de)\s*[:.]?\s*([a-zA-Z\s]+)/i);
        if (nameMatch) draft.clientName = nameMatch[1].trim();

        // --- 5. Summary / Notes ---
        draft.products[0].notes = prompt; // Put everything in notes
        draft.summary = `Pedido extraído de: "${prompt.substring(0, 30)}..." (Modo Offline)`;

        return {
            draft,
            missing: missing,
            nextQuestion: "La IA no está disponible. He extraído lo que pude, por favor verifica los datos.",
            mode: 'fallback',
            warning: "IA no configurada. Usando analizador básico."
        };
    }
};

module.exports = aiDraftService;