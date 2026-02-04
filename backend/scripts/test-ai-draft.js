const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { generateOrderDraft } = require('../services/openaiResponsesClient');

const runTests = async () => {
    console.log("🤖 Testing AI Order Draft...");

    let mockClient = null;

    if (!process.env.OPENAI_API_KEY) {
        console.warn("⚠️  WARNING: No OPENAI_API_KEY found. Using MOCK client for verification.");

        mockClient = {
            apiKey: 'mock-key',
            chat: {
                completions: {
                    create: async () => {
                        return {
                            choices: [{
                                message: {
                                    content: JSON.stringify({
                                        draft: {
                                            customerName: "Juan",
                                            phone: null,
                                            productType: "cake",
                                            isBaseCake: true,
                                            size: null,
                                            flavor: "chocolate",
                                            filling: "fresa",
                                            quantity: 20,
                                            deliveryDate: null,
                                            deliveryTime: null,
                                            notes: null
                                        },
                                        missing: ["phone", "deliveryDate"],
                                        nextQuestion: "Mock: ¿Para cuándo lo necesitas?"
                                    })
                                }
                            }]
                        }
                    }
                }
            }
        };
    }

    const testConversation = [
        { role: 'user', content: "Hola, quiero un pastel de chocolate" },
        { role: 'assistant', content: "Claro, ¿para cuántas personas?" },
        { role: 'user', content: "Para 20 personas, relleno de fresa" }
    ];

    try {
        console.log("Input Conversation:", JSON.stringify(testConversation, null, 2));
        const result = await generateOrderDraft(testConversation, mockClient);

        console.log("\n✅ AI Result:");
        console.log(JSON.stringify(result, null, 2));

        // Basic Validation
        if (result.draft && result.draft.flavor === 'chocolate' && result.draft.filling === 'fresa') {
            console.log("\n✨ SUCCESS: Extracted flavor and filling correctly.");
        } else {
            console.error("\n❌ FAILURE: Did not extract expected fields.");
            process.exit(1);
        }

        if (Array.isArray(result.missing) && typeof result.nextQuestion === 'string') {
            console.log("✨ SUCCESS: Structure is valid.");
        } else {
            console.error("❌ FAILURE: Invalid structure.");
        }

    } catch (error) {
        console.error("\n❌ ERROR:", error.message);
        process.exit(1);
    }
};

runTests();
