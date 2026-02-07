const fs = require('fs');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const EMAIL = process.env.EMAIL || 'admin@gmail.com';
const PASSWORD = process.env.PASSWORD || 'Admin1234';

async function getToken() {
    console.log(`🔑 Login as ${EMAIL}...`);
    try {
        const res = await fetch(`${BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: EMAIL, password: PASSWORD })
        });
        if (res.ok) {
            const data = await res.json();
            return data.token || data.accessToken || data.data?.token;
        }
    } catch (e) { }
    return null;
}

async function run() {
    console.log('🚀 Tenant Config Smoke Test...');
    const token = await getToken();
    if (!token) { console.error('❌ Login Failed'); process.exit(1); }

    const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

    // 1. GET Config (Defaults or Existing)
    console.log('--- GET /api/tenant/config ---');
    const getRes = await fetch(`${BASE_URL}/api/tenant/config`, { headers });
    if (!getRes.ok) {
        console.error('❌ GET Failed:', await getRes.text());
        process.exit(1);
    }
    const getData = await getRes.json();
    console.log('✅ GET Config:', getData.data);

    // 2. PUT Config (Valid)
    const newName = `Pastelería Test ${Date.now()}`;
    const newColor = '#FF5733';

    console.log(`--- PUT /api/tenant/config (Update to ${newName}) ---`);
    const putRes = await fetch(`${BASE_URL}/api/tenant/config`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
            businessName: newName,
            primaryColor: newColor,
            footerText: 'Smoke Test Footer',
            logoUrl: 'https://placehold.co/100'
        })
    });

    if (!putRes.ok) {
        console.error('❌ PUT Failed:', await putRes.text());
        process.exit(1);
    }
    const putData = await putRes.json();
    console.log('✅ PUT Response:', putData.data);

    if (putData.data.businessName !== newName || putData.data.primaryColor !== newColor) {
        console.error('❌ Update did not persist correctly in response');
        process.exit(1);
    }

    // 3. Negative Test (Invalid Color)
    console.log('--- Negative Test: Invalid Color ---');
    const failRes = await fetch(`${BASE_URL}/api/tenant/config`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ primaryColor: 'INVALID-COLOR' })
    });

    if (failRes.status === 400) {
        console.log('✅ Correctly rejected invalid color (400)');
    } else {
        console.error('❌ Failed to reject invalid color. Status:', failRes.status);
        process.exit(1);
    }

    console.log('🎉 Tenant Config Smoke Test Passed!');
}

run();
