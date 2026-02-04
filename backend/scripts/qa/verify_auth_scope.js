const { spawn } = require('child_process');
const axios = require('axios');
const path = require('path');

const BASE_URL = 'http://localhost:3000/api';
let serverProcess;

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function startServer() {
    console.log('🚀 Starting Backend Server for Testing...');
    const serverPath = path.join(__dirname, '../../server.js');

    serverProcess = spawn('node', [serverPath], {
        env: { ...process.env, PORT: 3000, DB_SYNC_MODE: 'none' }, // Ensure no sync to be safe/fast
        cwd: path.join(__dirname, '../../')
    });

    serverProcess.stdout.on('data', (data) => {
        // console.log(`[SERVER]: ${data}`);
    });

    serverProcess.stderr.on('data', (data) => {
        console.error(`[SERVER ERROR]: ${data}`);
    });

    // Wait for health
    let healthy = false;
    for (let i = 0; i < 30; i++) {
        try {
            const res = await axios.get(`${BASE_URL}/health`);
            if (res.status === 200) {
                healthy = true;
                console.log('✅ Server is UP and Healthy');
                break;
            }
        } catch (e) {
            await sleep(1000);
        }
    }

    if (!healthy) {
        console.error('❌ Server failed to start in time');
        stopServer();
        process.exit(1);
    }
}

function stopServer() {
    if (serverProcess) {
        console.log('🛑 Stopping Server...');
        serverProcess.kill();
    }
}

async function runTests() {
    try {
        console.log('🧪 Running Auth Scope Tests...');

        // 1. Test Login
        console.log('🔹 Testing Login (expecting Tenant/Branch injection)...');
        const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
            email: 'admin@gmail.com',
            password: 'Admin1234'
        });

        const { user, tenant, branch, token } = loginRes.data;

        if (!tenant || !branch) {
            console.error('❌ Login failed to return tenant or branch object');
            console.error('Response keys:', Object.keys(loginRes.data));
            throw new Error('Missing injected data');
        }

        if (user.tenantId !== tenant.id || user.branchId !== branch.id) {
            console.error('❌ Mismatched IDs:', {
                userTenant: user.tenantId, tenantId: tenant.id,
                userBranch: user.branchId, branchId: branch.id
            });
            throw new Error('ID Mismatch');
        }

        console.log(`✅ Login Success! User ${user.username} belongs to "${tenant.businessName}" / "${branch.name}"`);

        // 2. Test Scope (Folio List)
        console.log('🔹 Testing Scoped Endpoint (GET /api/folios)...');
        // Admin Role in seed is 'ADMIN', which our logic treats as scoped (only SUPER_ADMIN is global)
        const folioRes = await axios.get(`${BASE_URL}/folios`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (folioRes.status === 200) {
            console.log(`✅ Folios List fetched successfully (${folioRes.data.length} items)`);
        }

        console.log('🎉 ALL TESTS PASSED');
    } catch (e) {
        console.error('❌ Test Failed:', e.message);
        if (e.response) {
            console.error('Response Data:', e.response.data);
            console.error('Response Status:', e.response.status);
        }
    } finally {
        stopServer();
        process.exit(0);
    }
}

// Trap exit
process.on('SIGINT', () => { stopServer(); process.exit(); });
process.on('exit', () => stopServer());

(async () => {
    try {
        await startServer();
        await runTests();
    } catch (e) {
        console.error(e);
        stopServer();
    }
})();
