const { OpenAI } = require('openai');

// Configuración opcional de OpenAI
const openai = process.env.OPENAI_API_KEY ? new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
}) : null;

/**
 * Genera un borrador de pedido basado en texto libre.
 * POST /api/ai/draft
 * Body: { prompt: "..." }
 */
const generateDraft = async (req, res) => {
    try {
        const { prompt } = req.body;

        if (!prompt) {
            return res.status(400).json({ message: "Se requiere un prompt" });
        }

        // 1. MOCK / FALLBACK (Si no hay API Key)
        if (!openai) {
            console.log("⚠️ OpenAI no configurado. Usando Mock.");
            return res.json(mockResponse(prompt));
        }

        // 2. LLAMADA REAL A OPENAI
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
                                ]
                            },
                            "missing": string[], // Lista de datos cruciales que faltan (Fecha, sabor, etc)
                            "nextQuestion": string // Pregunta para obtener los datos faltantes
                        }`
                    },
                    { role: "user", content: prompt }
                ],
                temperature: 0.2, // Lograr consistencia
            });

            const content = completion.choices[0].message.content;

            // Limpiar posibles bloques de código Markdown
            const cleanJson = content.replace(/```json/g, '').replace(/```/g, '').trim();
            const parsedData = JSON.parse(cleanJson);

            return res.json(parsedData);

        } catch (aiError) {
            console.error("OpenAI Error:", aiError);
            // Fallback al mock si falla la API
            return res.json(mockResponse(prompt));
        }

    } catch (error) {
        console.error("Critical Draft Error:", error);
        res.status(500).json({ message: "Error generando borrador" });
    }
};

// Mock estúpido pero funcional para pruebas
function mockResponse(prompt) {
    const isBirthday = prompt.toLowerCase().includes('cumple');
    const isChocolate = prompt.toLowerCase().includes('chocolate');

    return {
        draft: {
            clientName: "Cliente (IA Detectado)",
            clientPhone: "",
            deliveryDate: new Date().toISOString().split('T')[0], // Hoy
            deliveryTime: "12:00",
            products: [{
                id: Date.now(),
                flavor: isChocolate ? "Chocolate" : "Vainilla",
                filling: isBirthday ? "Fresa" : "Durazno",
                design: "Decoración estándar por IA",
                notes: "Generado automáticamente"
            }]
        },
        missing: isBirthday ? [] : ["Temática del evento"],
        nextQuestion: isBirthday ? "" : "¿Para qué ocasión es el pastel?"
    };
}

module.exports = { generateDraft };
