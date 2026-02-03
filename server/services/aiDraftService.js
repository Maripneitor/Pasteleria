const { OpenAI } = require('openai');

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
            const completion = await openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [
                    {
                        role: "system",
                        content: `Eres un asistente de pastelería inteligente.
                        Tu trabajo es extraer detalles de pedidos del texto del usuario y devolver ONLY JSON válido.
                        No incluyas markdown.
                        
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
            // Fallback on error? Or rethrow? 
            // Let's rethrow to keep it simple, or fallback if network error.
            throw error;
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
        // Match YYYY-MM-DD
        const dateMatch = prompt.match(/\d{4}-\d{2}-\d{2}/);
        if (dateMatch) draft.deliveryDate = dateMatch[0];

        // Match "8 dic" or "8 de diciembre"
        // This is very basic, a real parser would need a library like Chrono

        // --- 2. Extract Time ---
        // Match 2pm, 2:00pm, 14:00
        const timeMatch = prompt.match(/(\d{1,2})(:(\d{2}))?\s*(am|pm|hrs)?/i);
        if (timeMatch) {
            // Simple extraction, normalization left to user validation
            draft.deliveryTime = timeMatch[0];
        }

        // --- 3. Extract Phone ---
        const phoneMatch = prompt.match(/\b\d{10}\b/);
        if (phoneMatch) draft.clientPhone = phoneMatch[0];

        // --- 4. Guess Name (Very hard without NLP) ---
        // Look for "Cliente: X" or "Nombre: X"
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
