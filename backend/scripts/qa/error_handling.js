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

    // 5. Test 403: Cross-Tenant Data Access (Isolation)
    const { Tenant, User, Flavor } = require('../../models');

    // Create Tenant B
    const tenantB = await Tenant.create({ businessName: 'Competencia S.A.', maxBranches: 1 });
    const flavorB = await Flavor.create({ name: 'Sabor Exclusivo B', tenantId: tenantB.id, price: 999 });

    console.log(`\n🧪 Testing Isolation with Tenant B (ID: ${tenantB.id})...`);

    // Attempt to access Flavor B using Token A
    // Note: If the endpoint filters by user's tenantId automatically (where: { tenantId }), it might return 404 (Not Found) or empty list, which is also valid isolation.
    // Use a direct update or get by ID endpoint if available.

    // Try GET /catalog/flavors (Should only see Tenant A's flavors)
    const listRes = await testFetch('/catalog/flavors', 'GET', token);
    const visibleFlavors = listRes.data || [];
    const canSeeSecret = visibleFlavors.find(f => f.name === 'Sabor Exclusivo B');

    if (!canSeeSecret) console.log("✅ Isolation Passed: Cannot see Tenant B's data in list.");
    else {
        console.error("❌ Isolation FAILED: Can see Tenant B's data!");
        process.exit(1);
    }

    // Try Direct Access (Verify 404 or 403)
    // We don't have a direct GET /catalog/flavors/:id documented in list, but usually update uses ID.
    // Let's try to update it.
    const updateRes = await testFetch(`/catalog/flavors/${flavorB.id}`, 'PUT', token, { name: "HACKED" });
    if (updateRes.status === 404 || updateRes.status === 403) {
        console.log(`✅ Write Isolation Passed: Update attempt returned ${updateRes.status}`);
    } else {
        console.error(`❌ Write Isolation FAILED. Status: ${updateRes.status}`);
    }

    // Cleanup
    await flavorB.destroy();
    await tenantB.destroy();

    console.log("🏁 ERROR SUITE COMPLETE");
}

run();
