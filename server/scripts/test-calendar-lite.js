// server/scripts/test-calendar-lite.js
const proxyquire = require('proxyquire').noCallThru();

// MOCK DATA
const mockFolio = {
    id: 1,
    folio_numero: 'FOL-001',
    cliente_nombre: 'Test Client',
    fecha_entrega: '2023-10-10',
    hora_entrega: '10:00',
    estatus_pago: 'Pendiente',
    estatus_folio: 'Activo',
    sabores_pan: ['Chocolate'], // Heavy data
    toJSON: function () { return this; }
};

// MOCK MODELS
const mockModels = {
    '../models/Folio': {
        findAll: async () => [mockFolio], // Calendar returns array
        findByPk: async (id) => mockFolio // Detail returns object
    },
    '../services/pdfService': {},
    '../services/commissionService': {}
};

// LOAD CONTROLLER WITH MOCKS
const folioController = proxyquire('../controllers/folioController', mockModels);

// TEST HELPERS
const mockRes = () => {
    const res = {};
    res.json = (data) => { res.data = data; return res; };
    res.status = (code) => { res.statusCode = code; return res; };
    return res;
};

async function runTest() {
    console.log("--- TEST 1: Calendar Lite Endpoint ---");
    const req1 = { query: { start: '2023-10-01', end: '2023-10-31' } };
    const res1 = mockRes();

    await folioController.getCalendarEvents(req1, res1);

    const event = res1.data[0];
    console.log("Response Object:", event);

    // Asserts
    console.assert(event.title.includes('FOL-001'), "Title missing");
    console.assert(event.statusPago === 'Pendiente', "StatusPago missing");
    console.assert(event.extendedProps === undefined, "FAIL: extendedProps should NOT be present");
    console.assert(event.sabores_pan === undefined, "FAIL: Heavy data (sabores_pan) leaked to root");
    console.assert(event.color !== undefined, "Color missing");

    if (!event.extendedProps && event.statusPago) {
        console.log("✅ Lite Payload Verified");
    } else {
        console.error("❌ Lite Payload Failed");
        process.exit(1);
    }

    console.log("\n--- TEST 2: Detail Endpoint logic (getFolioById) ---");
    const req2 = { params: { id: 1 } };
    const res2 = mockRes();

    await folioController.getFolioById(req2, res2);
    const detail = res2.data;

    // DETAIL should have heavy data
    console.assert(detail.sabores_pan && detail.sabores_pan[0] === 'Chocolate', "Detail payload missing heavy data");

    if (detail.sabores_pan) {
        console.log("✅ Detail Payload Verified");
    } else {
        console.error("❌ Detail Payload Failed");
        process.exit(1);
    }
}

runTest().catch(e => {
    console.error(e);
    process.exit(1);
});
