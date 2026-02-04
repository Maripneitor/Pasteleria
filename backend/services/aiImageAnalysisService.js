// server/services/aiImageAnalysisService.js
require('dotenv').config();
const OpenAI = require('openai');

let openai;

function getOpenAIClient() {
    if (!openai) {
        if (!process.env.OPENAI_API_KEY) {
            throw new Error("OPENAI_API_KEY no está configurada en las variables de entorno.");
        }
        openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });
    }
    return openai;
}

async function analyzeInspirationImage(imageBase64) {
    console.log("🤖 Iniciando análisis de imagen con IA Visual...");

    if (!imageBase64) {
        throw new Error("No se proporcionó la imagen en formato Base64.");
    }

    const prompt = `
        Analiza la siguiente imagen de un pastel y describe sus características principales. Enfócate en:
        1.  **Descripción Visual:** Colores predominantes, número de pisos (si aplica), forma general, estilo (ej. moderno, clásico, infantil), decoraciones principales (flores, figuras, patrones, texto).
        2.  **Técnicas Probables:** Identifica técnicas que parecen haberse usado (ej. cobertura de fondant, buttercream liso/con textura, drip, piping específico, uso de aerógrafo, modelado de figuras, flores de azúcar/naturales).
        3.  **Complejidad Estimada:** Basado en los detalles, clasifica la complejidad general como 'Simple', 'Moderada' o 'Compleja', y menciona brevemente por qué (ej. 'Compleja debido a las figuras modeladas detalladas y múltiples técnicas').

        Responde únicamente en formato JSON con la siguiente estructura:
        {
          "description": "Descripción detallada...",
          "techniques": ["Técnica 1", "Técnica 2", ...],
          "complexity": "Simple/Moderada/Compleja",
          "complexity_reason": "Justificación breve..."
        }
        No incluyas nada más fuera del JSON.
    `;

    try {
        const client = getOpenAIClient();
        const response = await client.chat.completions.create({
            model: "gpt-4o", // Modelo con capacidad de visión
            messages: [
                {
                    role: "user",
                    content: [
                        { type: "text", text: prompt },
                        {
                            type: "image_url",
                            image_url: {
                                // Asegúrate que el base64 string incluya el prefijo MIME type
                                // ej: "data:image/jpeg;base64,..."
                                "url": imageBase64,
                                "detail": "low" // Puedes usar 'high' para más detalle (y costo)
                            },
                        },
                    ],
                },
            ],
            max_tokens: 500, // Ajusta según necesidad
            response_format: { type: "json_object" },
        });

        const resultJsonString = response.choices[0].message.content;
        console.log("🤖 Respuesta de Análisis Visual IA:", resultJsonString);
        const result = JSON.parse(resultJsonString);

        // Validar estructura básica
        if (!result || typeof result.description !== 'string' || !Array.isArray(result.techniques) || typeof result.complexity !== 'string') {
            throw new Error("La respuesta de la IA (Visión) no tiene el formato esperado.");
        }

        return result;

    } catch (error) {
        console.error("❌ Error llamando a OpenAI Vision:", error);
        throw new Error(`Error en el análisis de imagen con IA: ${error.response?.data?.error?.message || error.message}`);
    }
}

module.exports = { analyzeInspirationImage };