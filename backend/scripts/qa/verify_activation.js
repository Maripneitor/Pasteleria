const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const axios = require('axios');
const bcrypt = require('bcryptjs');
const { spawn } = require('child_process');

const { User, ActivationCode } = require('../../models');

const BASE_URL = 'http://localhost:3000/api';
let serverProcess;

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function startServer() {
    console.log('🚀 Starting Backend for Activation Test...');
    const serverPath = path.join(__dirname, '../../server.js');
    serverProcess = spawn('node', [serverPath], {
        env: { ...process.env, PORT: 3000, DB_SYNC_MODE: 'none' },
        cwd: path.join(__dirname, '../../')
    });

    // Wait for health
    let healthy = false;
    for (let i = 0; i < 30; i++) {
        try {
            const res = await axios.get(`${BASE_URL}/health`);
            if (res.status === 200) { healthy = true; break; }
        } catch (e) { await sleep(1000); }
    }
    if (!healthy) throw new Error('Server unreachable');
}

function stopServer() {
    if (serverProcess) serverProcess.kill();
}

async function runTest() {
    try {
        console.log('🧪 Testing Activation Flow...');

        // 1. Login as Admin
        const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
            email: 'admin@gmail.com', password: 'Admin1234'
        });
        const adminToken = loginRes.data.token;
        const tenantId = loginRes.data.user.tenantId;

        // 2. Generate Code for Branch 1
        console.log('🔹 Generating Code for Branch 1...');
        const genRes = await axios.post(`${BASE_URL}/activation/generate`, {
            branchId: 1,
            role: 'EMPLOYEE'
        }, { headers: { Authorization: `Bearer ${adminToken}` } });

        const code = genRes.data.code;
        console.log('✅ Generated Code:', code);

        // 3. Create Pending User
        const bcrypt = require('bcryptjs'); // Add this up top

        // ... inside runTest
        const hashedPassword = await bcrypt.hash('pass', 10);
        const pendUser = await User.create({
            username: 'TestBranchUser',
            email: `testbranch${Date.now()}@test.com`,
            password: hashedPassword,
            globalRole: 'USER',
            status: 'PENDING'
        });
        console.log('✅ User Created:', pendUser.id);

        // Mock Login of Pending User (to get token to verify)
        // Usually frontend logs in, gets 403 with tempToken.
        // We will simulate we have the temp token logic or just force a login if system allowed pending login
        // But authService throws 403 with tempToken. let's fetch that.

        let tempToken;
        try {
            await axios.post(`${BASE_URL}/auth/login`, {
                email: pendUser.email, password: 'pass'
            });
        } catch (e) {
            if (e.response && e.response.status === 403 && e.response.data?.tempToken) {
                tempToken = e.response.data.tempToken;
                console.log('✅ Got Temp Token for Pending User');
            } else {
                console.error('Login Error Response:', e.response?.data);
                throw new Error('Failed to get temp token: ' + e.message);
            }
        }

        // 4. Verify Code
        console.log('🔹 Activating Account...');
        const verifyRes = await axios.post(`${BASE_URL}/activation/verify`, {
            code
        }, { headers: { Authorization: `Bearer ${tempToken}` } });

        console.log('✅ Activation Response:', verifyRes.data.message);

        // 5. Check DB State
        const finalUser = await User.findByPk(pendUser.id);
        if (finalUser.branchId === 1 && finalUser.tenantId === tenantId && finalUser.status === 'ACTIVE') {
            console.log('🎉 SUCCESS: User assigned to Branch 1 and Active');
        } else {
            console.error('❌ FAILED: User state mismatch', finalUser.toJSON());
            throw new Error('State mismatch');
        }

    } catch (e) {
        console.error('❌ TEST FAILED:', e.message);
        console.error('Full Error:', e);
        if (e.response) {
            console.error('Response Status:', e.response.status);
            console.error('Response Data:', e.response.data);
        }
    } finally {
        stopServer();
        process.exit(0);
    }
}

(async () => {
    try {
        await startServer();
        await runTest();
    } catch (e) {
        console.error(e);
        stopServer();
    }
})();
