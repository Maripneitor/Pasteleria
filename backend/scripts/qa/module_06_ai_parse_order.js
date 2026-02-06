const { sequelize } = require('../../models');
const CakeFlavor = require('../../models/CakeFlavor');
const aiOrderParsingService = require('../../services/aiOrderParsingService');
const aiOrderController = require('../../controllers/aiOrderController');
const { chalk, ok, fail, section, getExitCode } = require('./_report');
require('dotenv').config({ path: '../../.env' });

// Mock Request/Response for Controller Test
const mockReq = (body, user) => ({ body, user, tenantId: user.tenantId });
const mockRes = () => {
    const res = {};
    res.status = (code) => { res.statusCode = code; return res; };
    res.json = (data) => { res.data = data; return res; };
    return res;
};

// Mock User
const mockUser = { id: 1, tenantId: 1, branchId: 1 };

async function runTests() {
    section('MODULE 06: AI ORDER PARSING & RAG');

    await sequelize.authenticate();

    // 1. Ensure Catalog Data exists for Reference
    let flavor = await CakeFlavor.findOne({ where: { tenantId: 1 } });
    if (!flavor) {
        flavor = await CakeFlavor.create({ name: 'TestFlavorAI', tenantId: 1 });
    }
    const realFlavorId = flavor.id;
    const fakeFlavorId = 999999;

    console.log(chalk.blue(`🔹 Setup: Using Real Flavor ID ${realFlavorId} / Mock Fake ID ${fakeFlavorId}`));


    // 2. Monkey Patch AI Service
    // We override the internal _callOpenAI to avoid paying OpenAI and determinstic testing
    aiOrderParsingService._callOpenAI = async (text, context) => {
        // Mock logic based on exact matches or order
        if (text.includes('INVALID_ORDER')) {
            return {
                customerName: 'Bad User',
                flavorId: fakeFlavorId, // Does NOT exist
                specs: 'Invalid Order'
            };
        }
        if (text.includes('VALID_ORDER')) {
            return {
                customerName: 'AI User',
                phone: '555-AI',
                deliveryDate: '2026-10-10',
                flavorId: realFlavorId, // Exists
                specs: 'Valid Order'
            };
        }
        return {};
    };

    // ---------------------------------------------------------
    // TEST 1: Valid Order -> Draft Created
    // ---------------------------------------------------------
    console.log(chalk.blue('🔹 Test 1: Valid AI Response'));
    try {
        const req = mockReq({ text: 'I want a VALID_ORDER' }, mockUser);
        const res = mockRes();

        await aiOrderController.parseOrder(req, res);

        if (res.statusCode && res.statusCode !== 200) {
            fail(`Controller returned ${res.statusCode}`, res.data);
        } else if (res.data && res.data.valid && res.data.draft) {
            ok(`Draft Created ID: ${res.data.draft.id} - Status: ${res.data.draft.status}`);
        } else {
            fail('Response structure invalid', res.data);
        }

    } catch (e) {
        fail('Test 1 Exception', e);
    }

    // ---------------------------------------------------------
    // TEST 2: Invalid ID -> Validation Error (No Draft)
    // ---------------------------------------------------------
    console.log(chalk.blue('🔹 Test 2: Invalid ID (Validation)'));
    try {
        const req = mockReq({ text: 'I want an INVALID_ORDER' }, mockUser);
        const res = mockRes();

        await aiOrderController.parseOrder(req, res);

        console.log('DEBUG RES:', { statusCode: res.statusCode, data: res.data });

        if (res.statusCode === 400 && res.data && !res.data.valid && res.data.errors.length > 0) {
            ok(`Blocked Correctly. Errors: ${json(res.data.errors)}`);
        } else {
            fail(`Should have failed with 400. Got ${res.statusCode}`, res.data);
        }

    } catch (e) {
        fail('Test 2 Exception', e);
    }
}

function json(o) { return JSON.stringify(o); }

runTests().then(() => {
    process.exit(getExitCode());
});
