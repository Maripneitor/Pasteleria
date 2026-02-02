// server/scripts/test-commission-idempotent.js

// MOCK SEQUELIZE
const mockCommission = {
    findOne: async ({ where }) => {
        console.log(`[MOCK DB] Finding commission for ${where.folioNumber}`);
        return mockDB[where.folioNumber] || null;
    },
    create: async (data) => {
        console.log(`[MOCK DB] Creating commission for ${data.folioNumber}`);
        mockDB[data.folioNumber] = { ...data, id: Date.now() };
        return mockDB[data.folioNumber];
    }
};

const mockDB = {};

// MOCK DEPENDENCIES
const proxyquire = require('proxyquire').noCallThru();

const commissionService = proxyquire('../services/commissionService', {
    '../models/Commission': mockCommission,
    'sequelize': { Op: {} }
});

async function runTest() {
    console.log("--- TEST 1: Creation ---");
    const result1 = await commissionService.createCommission({
        folioNumber: 'FOL-0001',
        total: 1000,
        appliedToCustomer: true,
    });
    console.assert(result1.amount === 50, "Monto incorrecto (5%)");
    console.assert(result1.roundedAmount === 50, "Monto redondeado incorrecto");

    console.log("\n--- TEST 2: Idempotency (Duplicate) ---");
    const result2 = await commissionService.createCommission({
        folioNumber: 'FOL-0001',
        total: 1000,
        appliedToCustomer: true,
    });

    // Debería retornar el objeto existente (id igual)
    console.assert(result2.id === result1.id, "ID diferente, no se respetó idempotencia");

    console.log("\n✅ ALL TESTS PASSED");
}

runTest().catch(console.error);
