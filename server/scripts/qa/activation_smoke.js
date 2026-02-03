const axios = require('axios');
require('dotenv').config();
const { User, ActivationCode, sequelize } = require('../../models');

const API_URL = 'http://localhost:3001/api';

async function run() {
    console.log("🔍 Starting Activation Smoke Test...\n");
    const uniqueId = Date.now();

    try {
        // --- SCENARIO 1: OWNER SETUP ---
        console.log("1. Registering Owner...");
        const ownerEmail = `owner_${uniqueId}@test.com`;
        const r1 = await axios.post(`${API_URL}/auth/register`, {
            username: `owner_${uniqueId}`,
            email: ownerEmail,
            password: 'password123',
            globalRole: 'owner',
            tenantId: 999
        });
        const ownerId = r1.data.user.id;
        console.log("   ✅ Owner Created (Status: PENDING)");

        // Login check - should be blocked
        try {
            await axios.post(`${API_URL}/auth/login`, { email: ownerEmail, password: 'password123' });
            console.error("   ❌ Owner Login SHOULD FAIL but succeeded!");
        } catch (e) {
            if (e.response && e.response.status === 403 && e.response.data.code === 'ACCOUNT_PENDING') {
                console.log("   ✅ Owner Login Blocked (ACCOUNT_PENDING) as expected.");
            } else {
                console.error("   ❌ Owner Login Failed with unexpected error:", e.message);
            }
        }

        // FORCE ACTIVATE OWNER (GOD MODE)
        await User.update({ status: 'ACTIVE' }, { where: { id: ownerId } });
        console.log("   🔧 Owner Manually Activated (DB).");

        // Login Owner Again
        const l1 = await axios.post(`${API_URL}/auth/login`, { email: ownerEmail, password: 'password123' });
        const ownerToken = l1.data.token;
        console.log("   ✅ Owner Login Successful (Active).");


        // --- SCENARIO 2: GENERATE CODE ---
        console.log("\n2. Owner Generating Activation Code...");
        const g1 = await axios.post(`${API_URL}/activation/generate`, {}, {
            headers: { Authorization: `Bearer ${ownerToken}` }
        });
        const code = g1.data.code;
        console.log(`   ✅ Code Generated: ${code}`);


        // --- SCENARIO 3: USER FLOW ---
        console.log("\n3. Registering Employee (User)...");
        const userEmail = `user_${uniqueId}@test.com`;
        const r2 = await axios.post(`${API_URL}/auth/register`, {
            username: `user_${uniqueId}`,
            email: userEmail,
            password: 'password123',
            globalRole: 'employee'
        });
        const userId = r2.data.user.id;
        console.log("   ✅ User Created.");

        // Check Pending List (Owner should see this user)
        try {
            const pendingList = await axios.get(`${API_URL}/users/pending`, {
                headers: { Authorization: `Bearer ${ownerToken}` }
            });
            const foundReq = pendingList.data.find(u => u.id === userId);
            if (foundReq) console.log("   ✅ Owner sees user in Pending List.");
            else console.error("   ❌ Owner DID NOT see user in Pending List (Check Tenant logic or Filter).");
        } catch (e) {
            console.error("   ⚠️ Failed to fetch pending list:", e.response?.status);
        }

        // User Login - Expect 403 + TempToken
        let tempToken;
        try {
            await axios.post(`${API_URL}/auth/login`, { email: userEmail, password: 'password123' });
        } catch (e) {
            if (e.response && e.response.data.tempToken) {
                tempToken = e.response.data.tempToken;
                console.log("   ✅ User Login Blocked but received TempToken.");
            }
        }

        if (!tempToken) throw new Error("Did not receive temp token for activation!");

        // Verify Code
        console.log("   User Activating with Code...");
        const v1 = await axios.post(`${API_URL}/activation/verify`, { code }, {
            headers: { Authorization: `Bearer ${tempToken}` }
        });
        console.log("   ✅ Activation Response:", v1.data.message);

        // Final Login
        const l2 = await axios.post(`${API_URL}/auth/login`, { email: userEmail, password: 'password123' });
        const finalUser = l2.data.user;

        if (finalUser.tenantId === 999 && finalUser.ownerId === ownerId) {
            console.log("   ✅ User successfully assigned to Tenant 999 and Owner!");
        } else {
            console.error("   ❌ Tenant/Owner assignment failed:", finalUser);
        }

    } catch (e) {
        console.error("🔥 Smoke Test Failed:", e.message, e.response?.data);
    } finally {
        // await sequelize.close(); // Don't close if sharing connection? Script ends anyway.
    }
}

run();
