const { OpenAI } = require('openai');
const { CakeFlavor, Filling } = require('../models');
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
        // 1. Fetch RAG Context (Catalogs)
        const flavors = await CakeFlavor.findAll({
            where: { tenantId },
            attributes: ['id', 'name']
        });
        const fillings = await Filling.findAll({
            where: { tenantId },
            attributes: ['id', 'name']
        });

        const catalogContext = {
            flavors: flavors.map(f => ({ id: f.id, name: f.name })),
            fillings: fillings.map(f => ({ id: f.id, name: f.name }))
        };

        // 2. Call AI
        // We separate this method for easier mocking
        const aiResponse = await this._callOpenAI(text, catalogContext);

        // 3. Deterministic Validation
        const validation = this._validateIds(aiResponse, catalogContext);

        if (!validation.valid) {
            return { valid: false, errors: validation.errors };
        }

        return { valid: true, data: aiResponse };
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
You are an expert bakery shop assistant.
Context:
Flavors: ${JSON.stringify(context.flavors)}
Fillings: ${JSON.stringify(context.fillings)}

Current Date (Mexico City): ${new Date().toLocaleString("es-MX", { timeZone: "America/Mexico_City" })}

Instructions:
1. **Correction Priority:** If the user changes their mind (e.g., "Butter... no, better 3 milks"), ignore the first option and capture only the last confirmed instruction.
2. **Quantity Mapping:** Translate informal expressions like "about 50 people" to an integer (e.g., "numero_personas": 50).
3. **Date Inference:** If "Sunday Dec 8th" is mentioned, calculate the ISO format 'YYYY-MM-DD' assuming the nearest future date or default year 2026.
4. **Null Management:** If the phone number is missing, do NOT invent one. Return "phone": null.
5. **Flavor Normalization:** Map "3 milks" or similar to the official catalog name if it exists.
6. **Defaults:** If year is missing, assume 2026. If time is missing, set to "Pendiente".
7. **Conversational Response:** Generate a friendly, short response in Spanish ("assistant_response"). usage "missing_info" array to list what is missing (e.g., ["Teléfono", "Fecha"]). If everything is clear, confirm the order details.

Output JSON Schema:
{
  "customerName": string or null,
  "phone": string or null,
  "deliveryDate": string (YYYY-MM-DD) or null,
  "flavorId": number or null,
  "fillingId": number or null,
  "specs": string (description including quantities and design),
  "missing_info": string[],
  "assistant_response": string,
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
}

module.exports = new AiOrderParsingService();
