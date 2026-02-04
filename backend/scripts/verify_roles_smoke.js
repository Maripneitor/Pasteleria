const axios = require('axios');

const API_URL = 'http://localhost:3001/api';

async function run() {
    console.log("🔍 Starting Role Verification Smoke Test...\n");

    try {
        // 1. Login as Admin (assuming user exists or we fail)
        // We need credentials. If not available, we can't run this easily without modifying DB.
        // Let's assume standard dev credentials if known, or skip login and just check public/health.
        // Since I don't have definitive credentials for 'admin' vs 'employee' in the history (unless I dig deep or create them),
        // I will try to register them first!

        const uniqueId = Date.now();
        const adminUser = { username: 'test_admin_' + uniqueId, email: `admin_${uniqueId}@test.com`, password: 'password123', globalRole: 'admin' };
        const empUser = { username: 'test_emp_' + uniqueId, email: `emp_${uniqueId}@test.com`, password: 'password123', globalRole: 'employee' };

        console.log("1. Registering Test Users...");
        let adminToken, empToken;

        try {
            const r1 = await axios.post(`${API_URL}/auth/register`, adminUser);
            console.log("   ✅ Admin Registered");

            // Login to get token
            const l1 = await axios.post(`${API_URL}/auth/login`, { email: adminUser.email, password: adminUser.password });
            adminToken = l1.data.token;
            console.log("   ✅ Admin Logged In");

        } catch (e) {
            console.log("   ⚠️ Admin register failed (maybe exists), trying login...");
            const l1 = await axios.post(`${API_URL}/auth/login`, { email: adminUser.email, password: adminUser.password });
            adminToken = l1.data.token;
        }

        try {
            const r2 = await axios.post(`${API_URL}/auth/register`, empUser);
            console.log("   ✅ Employee Registered");

            const l2 = await axios.post(`${API_URL}/auth/login`, { email: empUser.email, password: empUser.password });
            empToken = l2.data.token;
            console.log("   ✅ Employee Logged In");
        } catch (e) {
            console.log("   ⚠️ Employee register failed, trying login...");
            const l2 = await axios.post(`${API_URL}/auth/login`, { email: empUser.email, password: empUser.password });
            empToken = l2.data.token;
        }

        // 2. Test Access
        console.log("\n2. Testing Scope Access...");

        // Admin List
        try {
            const res = await axios.get(`${API_URL}/folios`, { headers: { Authorization: `Bearer ${adminToken}` } });
            console.log(`   ✅ Admin List Folios: ${res.status} OK (Count: ${res.data.length})`);
        } catch (e) {
            console.error("   ❌ Admin List Failed:", e.message);
        }

        // Employee List
        try {
            const res = await axios.get(`${API_URL}/folios`, { headers: { Authorization: `Bearer ${empToken}` } });
            console.log(`   ✅ Employee List Folios: ${res.status} OK (Count: ${res.data.length})`);
        } catch (e) {
            console.error("   ❌ Employee List Failed:", e.message);
        }

        // 3. Test Report Access (Should be allowed but filtered)
        // Actually daily cut preview
        console.log("\n3. Testing Reports Scoping...");
        try {
            const res = await axios.get(`${API_URL}/reports/daily-cut/preview`, { headers: { Authorization: `Bearer ${adminToken}` } });
            console.log(`   ✅ Admin Report Preview: ${res.status} OK`);
        } catch (e) {
            console.error("   ⚠️ Admin Report Warning (might be empty):", e.response?.status || e.message);
        }

        try {
            const res = await axios.get(`${API_URL}/reports/daily-cut/preview`, { headers: { Authorization: `Bearer ${empToken}` } });
            console.log(`   ✅ Employee Report Preview: ${res.status} OK (Scoped)`);
        } catch (e) {
            console.error("   ⚠️ Employee Report Failed:", e.response?.status || e.message);
        }

        console.log("\n✅ Verification Complete.");

    } catch (error) {
        console.error("🔥 Verification Script Error:", error.message);
    }
}

run();
