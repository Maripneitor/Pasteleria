const { test, describe, before } = require('node:test');
const assert = require('node:assert');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const BASE_URL = `http://localhost:${process.env.PORT || 3000}/api`;
let token = '';
let createdFolioId = null;

describe('Order Flow Reliability', async () => {

    before(async () => {
        // 1. Authenticate (using known seeded or created user)
        // If login fails, tests will fail
        try {
            const res = await fetch(`${BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: process.env.ADMIN_EMAIL || 'admin@gmail.com',
                    password: process.env.ADMIN_PASSWORD || 'Admin1234'
                })
            });

            if (!res.ok) throw new Error(`Login failed: ${res.statusText}`);
            const data = await res.json();
            token = data.token;
            console.log('✅ Auth Token received');
        } catch (e) {
            console.error("Skipping tests due to login failure. Ensure test user exists.");
            process.exit(1);
        }
    });

    test('POST /folios - Should create a new order (201)', async () => {
        const payload = {
            cliente_nombre: "Integration Test Client",
            cliente_telefono: "5550001111",
            fecha_entrega: "2025-12-31",
            hora_entrega: "18:00",
            total: 350,
            tipo_folio: 'Normal'
        };

        const res = await fetch(`${BASE_URL}/folios`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });

        assert.strictEqual(res.status, 201, 'Status should be 201 Created');

        const data = await res.json();
        assert.ok(data.id, 'Response should have ID');
        assert.ok(data.folio_numero, 'Response should have Folio Number');

        createdFolioId = data.id;
        console.log(`✅ Created Order ID: ${createdFolioId}`);
    });

    test('GET /folios/:id - Persistence check', async () => {
        assert.ok(createdFolioId, 'Previous step must succeed');

        const res = await fetch(`${BASE_URL}/folios/${createdFolioId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        assert.strictEqual(res.status, 200, 'Should find order by ID');
        const data = await res.json();
        assert.strictEqual(data.id, createdFolioId);
        console.log(`✅ Verified persistence for Order ${createdFolioId}`);
    });

    test('POST /folios - Should return 400 + requestId on missing fields', async () => {
        // Missing cliente_nombre and telefono
        const badPayload = {
            fecha_entrega: "2025-12-31"
        };

        const res = await fetch(`${BASE_URL}/folios`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(badPayload)
        });

        assert.strictEqual(res.status, 400, 'Should reject invalid payload');

        const data = await res.json();
        assert.strictEqual(data.ok, false);
        assert.strictEqual(data.code, 'VALIDATION_ERROR'); // Custom code we added
        assert.ok(data.details, 'Should have details');

        // Header Verification
        const headerReqId = res.headers.get('X-Request-ID');
        assert.ok(headerReqId, 'Header X-Request-ID should exist');

        // Body Verification (if we put it there in catch block or middleware)
        // Note: Middleware doesn't inject into body automatically, but specific error handler does.
        // We added `requestId` to 400 response in folioController.
        assert.strictEqual(data.requestId, headerReqId, 'Body RequestID should match Header');

        console.log(`✅ Validation Error caught with Request ID: ${data.requestId}`);
    });

    test('GET /folios/calendar - Should include order in range', async () => {
        assert.ok(createdFolioId, 'Previous step must succeed');

        // Query strict range including the date we created (2025-12-31)
        const start = '2025-12-01';
        const end = '2026-01-31';

        const res = await fetch(`${BASE_URL}/folios/calendar?start=${start}&end=${end}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        assert.strictEqual(res.status, 200, 'Should return calendar events');
        const events = await res.json();

        const found = events.find(e => e.id === String(createdFolioId));
        assert.ok(found, `Order ${createdFolioId} should be in calendar range`);
        console.log(`✅ Verified Calendar presence for Order ${createdFolioId}`);
    });

    test('POST /folios - Should return 401 without token', async () => {
        const res = await fetch(`${BASE_URL}/folios`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({})
        });

        assert.strictEqual(res.status, 401, 'Should require authentication');
        console.log('✅ Verified Auth (401) protection');
    });
});
