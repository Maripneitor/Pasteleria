const fs = require('fs');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@gmail.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin1234';
const EMP_EMAIL = process.env.EMP_EMAIL; // Optional
const EMP_PASSWORD = process.env.EMP_PASSWORD;

async function getToken(email, password, roleLabel) {
    if (!email || !password) return null;

    console.log(`🔑 Login as ${roleLabel} (${email})...`);
    try {
        const endpoints = ['/api/auth/login', '/auth/login', '/api/login'];
        for (const ep of endpoints) {
            const res = await fetch(`${BASE_URL}${ep}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            if (res.ok) {
                const data = await res.json();
                const token = data.token || data.accessToken || data.data?.token;
                if (token) return token;
            }
        }
    } catch (e) {
        console.error(`❌ Login Error (${roleLabel}):`, e.message);
    }
    return null;
}

async function testEndpoint(label, url, method, token, expectedStatus) {
    console.log(`Testing ${label} -> ${method} ${url}`);
    try {
        const res = await fetch(url, {
            method,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: method === 'POST' ? JSON.stringify({}) : undefined
        });

        if ((Array.isArray(expectedStatus) && expectedStatus.includes(res.status)) || res.status === expectedStatus) {
            console.log(`✅ ${label}: Got ${res.status} (Expected)`);
            return true;
        } else {
            console.error(`❌ ${label}: Got ${res.status} (Expected ${expectedStatus})`);
            console.error('Response:', await res.text());
            return false;
        }
    } catch (e) {
        console.error(`❌ Error ${label}:`, e.message);
        return false;
    }
}

async function run() {
    console.log('🚀 Starting RBAC HTTP Smoke Test...');

    // 1. Get Tokens
    const adminToken = await getToken(ADMIN_EMAIL, ADMIN_PASSWORD, 'ADMIN');
    const empToken = await getToken(EMP_EMAIL, EMP_PASSWORD, 'EMPLOYEE');

    if (!adminToken) {
        console.error('❌ Could not get Admin Token. Check credentials.');
        process.exit(1);
    }

    let success = true;

    // 2. Test Protected Route: Close Cash (POST /api/cash/close)
    // Admin should be allowed (usually 200 or 400 if bad body, but NOT 403)
    // Employee should be 403.
    const CASH_CLOSE_URL = `${BASE_URL}/api/cash/close`;

    // We expect 400 or 200 for Admin (depending on logic/body requirements), but definitly NOT 403/401.
    // Actually, Close Cash likely needs a body or logic check. 
    // If we send empty body, controller might return 400 or 500. 
    // Let's settle for checking NOT 403.

    console.log('--- Checking Admin Privileges ---');
    if (!await testEndpoint('Admin Close Cash', CASH_CLOSE_URL, 'POST', adminToken, [200, 201, 400, 500])) {
        // If got 403, fail.
        success = false;
    }

    if (empToken) {
        console.log('--- Checking Employee Restrictions ---');
        // Employee MUST get 403
        if (!await testEndpoint('Employee Close Cash', CASH_CLOSE_URL, 'POST', empToken, 403)) {
            success = false;
        }
    } else {
        console.warn('⚠️ No Employee Check (missing env EMP_EMAIL). Skipping negative test.');
    }

    // 3. Test Public Route (Health)
    console.log('--- Checking Public Access ---');
    try {
        const res = await fetch(`${BASE_URL}/api/health`);
        if (res.ok) console.log('✅ Public Health: 200 OK');
        else { console.error('❌ Public Health Failed'); success = false; }
    } catch (e) { console.error('❌ Public Health Error', e); success = false; }

    if (success) {
        console.log('🎉 RBAC Smoke Test Passed!');
        process.exit(0);
    } else {
        console.error('❌ RBAC Smoke Test Failed');
        process.exit(1);
    }
}

run();
