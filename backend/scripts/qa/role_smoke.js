/**
 * QA Smoke Test: Roles & Multi-tenancy
 * Uses existing Users created by 'seed:full'
 */
const { User, Tenant, Folio } = require('../../models');
const axios = require('axios'); // Ensure axios is installed or use standard fetch if node 18+
const jwt = require('jsonwebtoken');

const BASE_URL = 'http://localhost:3000/api';

async function testLogin(email, password, label) {
    try {
        const response = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        if (!response.ok) throw new Error(`Login failed: ${response.status}`);
        const data = await response.json();
        console.log(`✅ [${label}] Login OK. Token received. Tenant: ${data.user.tenantId}`);
        return data.token;
    } catch (e) {
        console.error(`❌ [${label}] Login Failed:`, e.message);
        return null;
    }
}

async function runQA() {
    console.log("\n🧪 STARTING QA SMOKE TEST (Multi-tenancy)...\n");

    // 1. Login as SuperAdmin
    const tokenSA = await testLogin(process.env.ADMIN_EMAIL || 'admin@macair.com', process.env.ADMIN_PASSWORD || 'admin123', 'SuperAdmin');

    // 2. Login as Owner
    const tokenOwner = await testLogin('owner@demo.com', 'admin123', 'Owner');

    // 3. Login as Employee
    const tokenEmp = await testLogin('cajero@demo.com', 'admin123', 'Employee');

    if (!tokenSA || !tokenOwner) {
        console.error("⚠️ Skipping further tests due to login failure.");
        process.exit(1);
    }

    // 4. Test SuperAdmin Global Stats (Hidden Endpoint)
    try {
        const res = await fetch(`${BASE_URL}/super/global-stats`, {
            headers: { 'Authorization': `Bearer ${tokenSA}` }
        });
        if (res.ok) {
            const data = await res.json();
            console.log(`✅ [SuperAdmin] Access Global Stats: OK (Tenants: ${data.tenants}, Sales: ${data.globalSales})`);
        } else {
            console.error(`❌ [SuperAdmin] Failed to access Global Stats: ${res.status}`);
        }
    } catch (e) { console.error(e); }

    // 5. Test Isolation: Employee trying to see Global Stats (Should Fail)
    try {
        const res = await fetch(`${BASE_URL}/super/global-stats`, {
            headers: { 'Authorization': `Bearer ${tokenEmp}` }
        });
        if (res.status === 403) {
            console.log(`✅ [Security] Employee denied specific Admin route: OK (403)`);
        } else {
            console.error(`❌ [Security] Employee accessed Admin route! Status: ${res.status}`);
        }
    } catch (e) { console.error(e); }

    console.log("\n🏁 QA SMOKE TEST COMPLETE.");
}

// Simple fetch polyfill check for older node
if (!globalThis.fetch) {
    console.log("No fetch available, please use Node 18+");
    process.exit(1);
}

runQA();
