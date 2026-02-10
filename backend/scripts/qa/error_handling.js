const { Folio } = require('../../models');
const jwt = require('jsonwebtoken');

const BASE_URL = 'http://localhost:3000/api';
const SECRET = process.env.JWT_SECRET || 'secret_dev_key';

async function testFetch(url, method, token, body = null) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(BASE_URL + url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : null
    });
    return { status: res.status, data: await res.json().catch(() => ({})) };
}

async function run() {
    console.log("🧪 STARTING ERROR HANDLING TEST SUITE...");

    // 1. Get Tokens
    const loginRes = await testFetch('/auth/login', 'POST', null, { email: 'owner@demo.com', password: 'admin123' });
    const token = loginRes.data.token;
    if (!token) { console.error("❌ Login Failed"); process.exit(1); }

    // 2. Test 403: Cross-Tenant Access
    // We try to access a resource we normally shouldn't.
    // Since we only seed 1 tenant, strict cross-tenant is hard to prove without a second tenant.
    // But we can try to access a 'SuperAdmin' route as Owner -> 403.
    const saRes = await testFetch('/super/global-stats', 'GET', token);
    if (saRes.status === 403) console.log("✅ 403 Forbidden (RBAC) - Pass");
    else console.error(`❌ 403 Failed. Got ${saRes.status}`);

    // 3. Test 400: Missing Fields
    const badOrder = { cliente_nombre: "NoOne" }; // Missing required fields
    const createRes = await testFetch('/folios', 'POST', token, badOrder);
    if (createRes.status === 400) console.log("✅ 400 Bad Request (Validation) - Pass");
    else console.error(`❌ 400 Failed. Got ${createRes.status}`);

    // 4. Test 401: Expired/Bad Token
    const badToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid";
    const authRes = await testFetch('/folios', 'GET', badToken);
    if (authRes.status === 401) console.log("✅ 401 Unauthorized (Bad Token) - Pass");
    else console.error(`❌ 401 Failed. Got ${authRes.status}`);

    // 5. Test 500 (Simulated via bad PDF generation or similar usually difficult via API)
    // We skip intentional 500 for safety, unless we have a specific 'crash' endpoint.

    console.log("🏁 ERROR SUITE COMPLETE");
}

run();
