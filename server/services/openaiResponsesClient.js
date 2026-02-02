const OpenAI = require('openai');

// Initialize OpenAI Client lazy or checking env
// Assumes process.env.OPENAI_API_KEY is present
let openai;

const getClient = () => {
    if (!openai) {
        openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });
    }
    return openai;
};

const MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

const ORDER_DRAFT_SCHEMA = {
    type: "json_schema",
    json_schema: {
        name: "order_draft_response",
        schema: {
            type: "object",
            properties: {
                draft: {
                    type: "object",
                    properties: {
                        customerName: { type: ["string", "null"] },
                        phone: { type: ["string", "null"] },
                        productType: { type: ["string", "null"], enum: ["cake", "pan", "postre", "otro", null] },
                        isBaseCake: { type: ["boolean", "null"] },
                        size: { type: ["string", "null"] },
                        flavor: { type: ["string", "null"] },
                        filling: { type: ["string", "null"] },
                        quantity: { type: ["number", "null"] },
                        deliveryDate: { type: ["string", "null"], description: "YYYY-MM-DD" },
                        deliveryTime: { type: ["string", "null"], description: "HH:mm" },
                        notes: { type: ["string", "null"] }
                    },
                    required: [
                        "customerName", "phone", "productType", "isBaseCake",
                        "size", "flavor", "filling", "quantity",
                        "deliveryDate", "deliveryTime", "notes"
                    ],
                    additionalProperties: false
                },
                missing: {
                    type: "array",
                    items: { type: "string" }
                },
                nextQuestion: {
                    type: "string",
                    description: "The response to the user, asking for missing info or confirming details."
                }
            },
            required: ["draft", "missing", "nextQuestion"],
            additionalProperties: false
        },
        strict: true
    }
};

/**
 * Generates an order draft based on the conversation history.
 * @param {Array<{role: string, content: string}>} conversationHistory 
 * @param {Object} [injectedClient] - Optional OpenAI client for testing
 * @returns {Promise<{draft: Object, missing: string[], nextQuestion: string}>}
 */
const generateOrderDraft = async (conversationHistory, injectedClient) => {
    try {
        const client = injectedClient || getClient();
        if (!client.apiKey) throw new Error("Missing OpenAI API Key");

        const messages = [
            {
                role: "system",
                content: `Eres un asistente de pastelería experto tomando pedidos.
Tu objetivo es completar un borrador de pedido (Order Draft) extrayendo la información de la conversación.
Si falta información crítica, pregúntala en 'nextQuestion'.
Si el usuario da información, actualiza el 'draft'.
Sé amable y profesional.`
            },
            ...conversationHistory
        ];

        const completion = await client.chat.completions.create({
            model: MODEL,
            messages: messages,
            response_format: ORDER_DRAFT_SCHEMA,
            temperature: 0.2
        });

        const content = completion.choices[0].message.content;

        // Parse the structured output
        const parsed = JSON.parse(content);
        return parsed;

    } catch (error) {
        console.error("[OpenAI] Error parsing structure:", error);
        // Fallback error response
        throw new Error("Failed to generate order draft from AI.");
    }
};

module.exports = {
    generateOrderDraft
};
