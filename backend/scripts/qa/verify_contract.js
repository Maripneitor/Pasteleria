// server/scripts/qa/verify_contract.js
const fs = require('fs');
const path = require('path');

// Load env vars before anything else
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const { requestJson, log, BASE_URL } = require('./_http');
const { loginAndGetToken } = require('./_auth');
const { ok, fail, section, getExitCode, chalk } = require('./_report');
const { sequelize } = require('../../models');
const { seedContractData } = require('./seed_contract_data'); // Import Seed

const CONTRACT_PATH = path.join(__dirname, '../../docs/expected_contract.json');

async function runCallback(fn) {
    try {
        await fn();
    } catch (err) {
        fail('Unexpected script error', err);
    }
}

async function verifyContract() {
    if (!fs.existsSync(CONTRACT_PATH)) {
        fail('Contract file missing', null, `ls ${CONTRACT_PATH}`);
        process.exit(1);
    }

    const contract = JSON.parse(fs.readFileSync(CONTRACT_PATH, 'utf8'));
    let token = null;

    // 0. Seed Data
    section('SEEDING');
    await seedContractData();

    // 1. Auth
    section('AUTHENTICATION');
    try {
        token = await loginAndGetToken();
        ok('Admin Login successful');
    } catch (err) {
        fail('Critical: Admin Login failed', err);
        process.exit(1);
    }

    // 2. API Endpoints
    section('API ENDPOINTS');

    // Get a valid Folio ID for parameters
    const { Folio } = require('../../models');
    const validFolio = await Folio.findOne({ order: [['createdAt', 'DESC']] });
    const validFolioId = validFolio ? validFolio.id : 1;
    if (!validFolio) console.log(chalk.yellow('Warning: No Folio found for parameter replacement'));

    for (const ep of contract.apiEndpoints) {
        const { name, method, path, auth } = ep;
        let url = `${BASE_URL}${path}`;

        // Replace :id
        if (url.includes(':id')) {
            url = url.replace(':id', validFolioId);
        }

        // Inject date param for day-summary-pdf
        if (url.includes('day-summary-pdf')) {
            const today = new Date().toISOString().split('T')[0];
            url += `?date=${today}`;
        }

        // Test 1: Unauthenticated (if auth required)
        if (auth === 'required') {
            try {
                const res = await requestJson({ method, url });
                if (res.status === 401 || res.status === 403) {
                    ok(`[${method}] ${path} blocked without token (Got ${res.status})`);
                } else {
                    fail(`[${method}] ${path} should be blocked but got ${res.status}`, null, `curl -X ${method} ${url}`);
                }
            } catch (err) {
                // If network error, it's a fail
                fail(`[${method}] ${path} network error on unauth check`, err);
            }
        }

        // Test 2: Authenticated (or Public) - Expect Success 2xx
        try {
            const body = ep.body || undefined;
            const res = await requestJson({ method, url, token, body });
            if (res.status >= 200 && res.status < 300) {
                ok(`[${method}] ${path} working (${res.status})`);
            } else {
                // "request con token debe dar 200/2xx"
                fail(`[${method}] ${path} failed with ${res.status}`, res.data, `curl -X ${method} ${url} -H "Authorization: Bearer ${token}"`);
            }
        } catch (err) {
            fail(`[${method}] ${path} network error`, err);
        }
    }

    // 3. Database Tables
    section('DATABASE TABLES');
    try {
        const [results] = await sequelize.query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = DATABASE()
    `);
        const existingTables = results.map(r => r.TABLE_NAME);

        for (const table of contract.dbTables) {
            if (existingTables.includes(table)) {
                ok(`Table '${table}' exists`);
            } else {
                fail(`Table '${table}' is MISSING`);
            }
        }
    } catch (err) {
        fail('Database check failed', err);
    } finally {
        // Close DB connection
        try {
            await sequelize.close();
        } catch (e) { /* ignore close error */ }
    }

    // 4. Frontend Routes
    section('FRONTEND ROUTES');
    const distPath = path.join(__dirname, '../../../client/dist');
    if (fs.existsSync(distPath)) {
        log.info('client/dist found. Verifying SPA routing...');
        for (const route of contract.frontendRoutes) {
            const url = `${BASE_URL}${route}`;
            try {
                const res = await requestJson({ method: 'GET', url });
                if (res.status === 200) {
                    ok(`Route ${route} is served (200)`);
                } else {
                    fail(`Route ${route} returned ${res.status}`, null, `curl ${url}`);
                }
            } catch (err) {
                fail(`Route ${route} check error`, err);
            }
        }
    } else {
        console.log(chalk.yellow('Skipping Frontend checks (client/dist not found)'));
    }
}

runCallback(verifyContract).then(() => {
    const code = getExitCode();
    if (code === 0) {
        console.log(chalk.green('\n✅ VERIFICATION PASSED'));
    } else {
        console.log(chalk.red('\n❌ VERIFICATION FAILED'));
    }
    process.exit(code);
});
