const { OpenAI } = require('openai');
const fs = require('fs');
const path = require('path');

const openai = process.env.OPENAI_API_KEY ? new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
}) : null;

const aiDraftService = {

    // AHORA RECIBE LOS SABORES Y RELLENOS DISPONIBLES
    async processDraft(prompt, saboresDisponibles = [], rellenosDisponibles = []) {
        if (!prompt) throw new Error("Prompt required");

        if (openai) {
            return await this._generateWithOpenAI(prompt, saboresDisponibles, rellenosDisponibles);
        } else {
            return this._generateFallback(prompt);
        }
    },

    async _generateWithOpenAI(prompt, saboresDisponibles, rellenosDisponibles) {
        try {
            const hoy = new Date().toLocaleDateString('es-MX');
            
            // Texto dinámico con tus sabores y rellenos de la BD
            const catalogoTexto = (saboresDisponibles.length > 0 || rellenosDisponibles.length > 0) 
                ? `\n🚨 CATÁLOGO ESTRICTO DE INVENTARIO:
                - Sabores de pan permitidos: ${saboresDisponibles.length > 0 ? saboresDisponibles.join(', ') : 'Cualquiera'}
                - Rellenos permitidos: ${rellenosDisponibles.length > 0 ? rellenosDisponibles.join(', ') : 'Cualquiera'}` 
                : '';

            const completion = await openai.chat.completions.create({
                model: "gpt-4o", // SUBIMOS A GPT-4O PARA QUE ENTIENDA TEXTOS GIGANTES
                messages: [
                    {
                        role: "system",
                        content: `Eres un asistente de pastelería inteligente de "La Fiesta".
                        Tu trabajo es extraer detalles MASIVOS de pedidos dictados por los empleados y devolver ONLY JSON válido.
                        Hoy es ${hoy}. Usa el año actual (${new Date().getFullYear()}) o el próximo para las fechas.
                        
                        🚨 REGLA CERO (EXTRACCIÓN SILENCIOSA): 
                        El empleado enviará un texto muy largo con todos los datos. Tu obligación absoluta es extraer TODOS los campos posibles al objeto "draft". 
                        ESTÁ PROHIBIDO decir que faltan datos si ya te dieron lo básico (Nombre y Fecha). Los campos "missing" y "nextQuestion" DEBEN IR SIEMPRE VACÍOS [].
                        ${catalogoTexto}
                        
                        Schema esperado:
                        {
                            "isOrderIntent": true,
                            "valid": true,
                            "aiResponse": "¡Borrador generado con éxito! Revisa los datos.",
                            "draft": {
                                "clientName": "string | null",
                                "clientPhone": "string | null",
                                "clientPhone2": "string | null",
                                "deliveryDate": "YYYY-MM-DD | null",
                                "deliveryTime": "HH:mm | null",
                                "persons": "number | null",
                                "folioType": "Base/Especial | Normal | null",
                                "hasExtraHeight": "boolean | false",
                                "cakeFlavor": ["array de strings"] | [],
                                "filling": ["array de strings"] | [],
                                "tiers": [
                                    { "persons": "number", "shape": "string", "panes": ["strings"], "rellenos": ["strings"], "notas": "string" }
                                ],
                                "complements": [
                                    { "persons": "number", "shape": "string", "flavor": "string", "filling": "string", "description": "string" }
                                ],
                                "designDescription": "string | null",
                                "dedication": "string | null",
                                "accessories": "string | null",
                                "additional": [
                                    { "name": "string", "price": "number" }
                                ],
                                "isDelivery": "boolean",
                                "deliveryLocation": "string | null",
                                "deliveryCost": "number | null",
                                "total": "number | null",
                                "advancePayment": "number | null",
                                "isPaid": "boolean | false",
                                "notesRaw": "string",
                                "summary": "Resumen de 1 linea."
                            },
                            "missing": [], 
                            "nextQuestion": ""
                        }`
                    },
                    { role: "user", content: prompt }
                ],
                temperature: 0.1, // Súper bajo para que sea estricto
            });

            const content = completion.choices[0].message.content;
            let cleanJson = content.replace(/```json/g, '').replace(/```/g, '').trim();
            const parsedData = JSON.parse(cleanJson);

            if (parsedData.valid === undefined) parsedData.valid = true;

            return {
                ...parsedData,
                mode: 'openai'
            };

        } catch (error) {
            console.error("OpenAI Service Error (Draft):", error);
            throw error;
        }
    },

    async processEdit(orderData, instruction, saboresDisponibles = [], rellenosDisponibles = []) {
        if (!openai) throw new Error("OpenAI API Key no configurada.");

        try {
            const hoy = new Date().toLocaleDateString('es-MX');

            const catalogoTexto = (saboresDisponibles.length > 0 || rellenosDisponibles.length > 0) 
                ? `\n🚨 CATÁLOGO ESTRICTO DE INVENTARIO:
                - Sabores permitidos: ${saboresDisponibles.length > 0 ? saboresDisponibles.join(', ') : 'Cualquiera'}
                - Rellenos permitidos: ${rellenosDisponibles.length > 0 ? rellenosDisponibles.join(', ') : 'Cualquiera'}
                
                REGLA DE RECHAZO: Si la instrucción pide CAMBIAR a un sabor o relleno que NO está en estas listas:
                1. Pon "valid": false.
                2. En "aiResponse", escribe un mensaje amable informando que no manejamos ese nuevo sabor/relleno y sugiere opciones válidas.
                3. Deja "updates" vacío.
                Si el cambio es válido o no involucra sabores/rellenos, pon "valid": true.` 
                : '"valid": true,';

            const completion = await openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [
                    {
                        role: "system",
                        content: `Eres un asistente de pastelería inteligente.
                        Recibirás un JSON con los datos actuales de un pedido y una instrucción del cliente para modificarlo. Hoy es ${hoy}.
                        Debes devolver ONLY JSON válido con los campos exactos de la base de datos que deben actualizarse.
                        No incluyas markdown.
                        ${catalogoTexto}
                        
                        Schema esperado:
                        {
                            "valid": boolean,
                            "aiResponse": string,
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
                temperature: 0.1,
            });

            const content = completion.choices[0].message.content;
            const cleanJson = content.replace(/```json/g, '').replace(/```/g, '').trim();
            const parsedData = JSON.parse(cleanJson);
            
            if (parsedData.valid === undefined) parsedData.valid = true;
            return parsedData;

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
                                "q": "string (Palabra clave corta) o vacío si solo menciona fechas",
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

    async processInsights(question, dbStats) {
        if (!openai) throw new Error("OpenAI API Key no configurada.");

        try {
            const completion = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [
                    {
                        role: "system",
                        content: `Eres el Analista de Datos experto de "Pastelería La Fiesta".
                        Se te proporcionará un JSON con la lista de pedidos de los últimos 30 días.
                        Tu objetivo es responder la pregunta del dueño basándote ÚNICAMENTE en estos datos.
                        
                        REGLAS:
                        - Si preguntan por "más vendido", cuenta las menciones en los arreglos 'sabores_pan' y 'rellenos'.
                        - Si preguntan por ventas o dinero, suma la columna 'total'.
                        - Sé amigable, directo y conciso (máximo 3 líneas).
                        - Devuelve ONLY JSON válido.
                        
                        Schema esperado:
                        {
                            "answer": "Tu respuesta analítica aquí."
                        }`
                    },
                    {
                        role: "user",
                        content: `DATOS DE LA BD (Últimos 30 días):\n${JSON.stringify(dbStats)}\n\nPREGUNTA DEL DUEÑO: ${question}`
                    }
                ],
                temperature: 0.1, 
            });

            const content = completion.choices[0].message.content;
            const cleanJson = content.replace(/```json/g, '').replace(/```/g, '').trim();
            return JSON.parse(cleanJson);

        } catch (error) {
            console.error("OpenAI Insights Error:", error);
            return { answer: "Hubo un error al analizar los datos. Por favor intenta de nuevo." };
        }
    },

    async analyzeImage(imageUrl) {
        if (!openai) throw new Error("OpenAI API Key no configurada.");
        try {
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
                        content: "Eres un asistente experto en diseño de pasteles. Analiza la imagen y describe detalladamente los elementos visuales para que un pastelero pueda replicarlo."
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
            summary: "Borrador generado automáticamente (Modo Offline)."
        };

        const missing = ["Verificar fecha/hora", "Confirmar sabor/relleno"];

        const phoneMatch = prompt.match(/\b\d{10}\b/);
        if (phoneMatch) draft.clientPhone = phoneMatch[0];

        const nameMatch = prompt.match(/(?:cliente|nombre|a nombre de)\s*[:.]?\s*([a-zA-Z\s]+)/i);
        if (nameMatch) draft.clientName = nameMatch[1].trim();

        return {
            isOrderIntent: true,
            valid: true,
            aiResponse: "",
            draft,
            missing: missing,
            nextQuestion: "La IA no está disponible. He extraído lo que pude, por favor verifica los datos.",
            mode: 'fallback'
        };
    }
};

module.exports = aiDraftService;