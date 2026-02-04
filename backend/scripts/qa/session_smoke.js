const axios = require('axios');
require('dotenv').config();
const API_URL = 'http://localhost:3001/api';

async function run() {
    console.log("🔍 Starting Session Smoke Test...\n");
    const uniqueId = Date.now();
    const email = `session_${uniqueId}@test.com`;
    const password = 'password123';

    try {
        // 1. Register User (PENDING)
        console.log("1. Registering User...");
        const r1 = await axios.post(`${API_URL}/auth/register`, {
            username: `session_user_${uniqueId}`,
            email,
            password,
            globalRole: 'employee'
        });
        const userId = r1.data.user.id;
        console.log("   ✅ User Created");

        // Force Activate (so we can login) - Using DB hack or just assuming models available
        // Since we are running outside server context (maybe?), we can't use models if not required correctly.
        // But `server/scripts` usually has access.
        // Let's assume we need to require models.
        const { User, UserSession } = require('../../models');
        await User.update({ status: 'ACTIVE' }, { where: { id: userId } });
        console.log("   🔧 User Manually Activated");

        // 2. Login 1
        console.log("2. Login #1 (Should Succeed)...");
        const l1 = await axios.post(`${API_URL}/auth/login`, { email, password });
        console.log("   ✅ Login #1 Success. Token:", l1.data.token.substring(0, 10) + "...");

        // 3. Login 2 (Should Fail with 409)
        console.log("3. Login #2 (Should Fail)...");
        try {
            await axios.post(`${API_URL}/auth/login`, { email, password });
            console.error("   ❌ Login #2 SUCCEEDED (Should have been blocked!)");
        } catch (e) {
            if (e.response && e.response.status === 409) {
                console.log("   ✅ Login #2 Blocked (409 Conflict) as expected.");
                console.log("      Message:", e.response.data.message);
            } else {
                console.error("   ❌ Login #2 Failed with WRONG error:", e.response ? e.response.status : e.message);
            }
        }

        // 4. Manual Session Cleanup (Simulate Logout)
        console.log("4. Simulating Logout (Clearing Session in DB)...");
        await UserSession.update({ isActive: false }, { where: { userId } });

        // 5. Login 3 (Should Succeed)
        console.log("5. Login #3 (Should Succeed)...");
        const l3 = await axios.post(`${API_URL}/auth/login`, { email, password });
        console.log("   ✅ Login #3 Success.");

    } catch (e) {
        console.error("🔥 Session Test Failed:", e);
    }
}

run();
