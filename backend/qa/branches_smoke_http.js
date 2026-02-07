const fs = require('fs');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const EMAIL = process.env.EMAIL || 'admin@gmail.com';
const PASSWORD = process.env.PASSWORD || 'Admin1234';

async function getToken() {
    console.log(`🔑 Login as ${EMAIL}...`);
    const endpoints = ['/api/auth/login', '/auth/login', '/api/login'];
    for (const ep of endpoints) {
        try {
            const res = await fetch(`${BASE_URL}${ep}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: EMAIL, password: PASSWORD })
            });
            if (res.ok) {
                const data = await res.json();
                return data.token || data.accessToken || data.data?.token;
            }
        } catch (e) { }
    }
    return null;
}

async function run() {
    console.log('🚀 Branch API Smoke Test...');
    const token = await getToken();
    if (!token) { console.error('❌ Login Failed'); process.exit(1); }

    const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
    const branchName = `Smoke Test ${Date.now()}`;
    let branchId = null;
    let initialTenantId = null;

    // 1. Create Branch
    console.log('--- Testing Create Branch ---');
    const createRes = await fetch(`${BASE_URL}/api/branches`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
            name: branchName,
            address: 'Calle Falsa 123',
            // Injection Attempt:
            tenantId: 99999
        })
    });

    if (createRes.status === 201) {
        const json = await createRes.json();
        const b = json.data || json;
        branchId = b.id;
        initialTenantId = b.tenantId;
        console.log(`✅ Branch Created: ID=${branchId}, Tenant=${b.tenantId}`);

        // Validation: Injection failed?
        if (String(b.tenantId) === '99999') {
            console.error('❌ CRITICAL: Tenant Injection SUCCEEDED!');
            process.exit(1);
        } else {
            console.log('✅ Tenant Injection Blocked (Tenant matches token)');
        }
    } else {
        console.error('❌ Create Failed:', verifyRes.status, await createRes.text());
        process.exit(1);
    }

    // 2. List Branches
    console.log('--- Testing List Branches ---');
    const listRes = await fetch(`${BASE_URL}/api/branches`, { headers });
    if (listRes.ok) {
        const json = await listRes.json();
        const list = json.data || json; // Handle array wrapper
        const found = list.find(x => String(x.id) === String(branchId));
        if (found) console.log('✅ Branch Listed Successfully');
        else {
            console.error('❌ Created branch not found in list');
            process.exit(1);
        }
    } else {
        console.error('❌ List Failed');
        process.exit(1);
    }

    // 3. Update Branch
    console.log('--- Testing Update Branch ---');
    const newName = branchName + ' UPDATED';
    const updateRes = await fetch(`${BASE_URL}/api/branches/${branchId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ name: newName })
    });

    if (updateRes.ok) {
        const json = await updateRes.json();
        const b = json.data || json;
        if (b.name === newName) console.log('✅ Branch Updated Successfully');
        else console.error('❌ Name not updated in response');
    } else {
        console.error('❌ Update Failed');
        process.exit(1);
    }

    console.log('🎉 Branch Smoke Test Passed!');
}

run();
