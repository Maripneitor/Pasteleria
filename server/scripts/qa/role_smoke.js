const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') }); // Explicit path
const { User } = require('../../models');

const API_URL = 'http://localhost:3001/api';

async function run() {
    console.log("🔍 Starting Role Smoke Test...\n");
    const uniqueId = Date.now();

    try {
        // 1. Register ADMIN
        console.log("1. Registering Admin...");
        const adminEmail = `admin_${uniqueId}@test.com`;
        const r1 = await axios.post(`${API_URL}/auth/register`, {
            username: `admin_${uniqueId}`,
            email: adminEmail,
            password: 'password123',
            globalRole: 'admin'
        });
        const adminId = r1.data.user.id;

        // Force Active
        await User.update({ status: 'ACTIVE' }, { where: { id: adminId } });

        // Login
        const l1 = await axios.post(`${API_URL}/auth/login`, { email: adminEmail, password: 'password123' });
        const token = l1.data.token;
        console.log("   ✅ Admin Logged In");

        // CALL /me
        const meRes = await axios.get(`${API_URL}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log("   --> /me Response:", meRes.data);

        if (meRes.data.role !== 'admin') throw new Error("Role mismatch for Admin");
        if (meRes.data.email !== adminEmail) throw new Error("Email mismatch");

        console.log("   ✅ Admin Role Verified correctly via /me");

    } catch (e) {
        console.error("🔥 Smoke Test Failed:", e.message);
        if (e.response) console.error("Response Data:", e.response.data);
        console.error(e);
        process.exit(1);
    }
}

run();
