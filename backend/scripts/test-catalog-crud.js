
const axios = require('axios');
// Colors removed to avoid dependency issues

const BASE_URL = 'http://localhost:3000/api';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@gmail.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin1234';

let token = '';

const log = (msg, type = 'info') => {
    if (type === 'success') console.log(`✅ ${msg}`);
    else if (type === 'error') console.error(`❌ ${msg}`);
    else console.log(`ℹ️ ${msg}`);
};

async function login() {
    try {
        log(`Logging in as ${ADMIN_EMAIL}...`);
        const res = await axios.post(`${BASE_URL}/auth/login`, {
            email: ADMIN_EMAIL,
            password: ADMIN_PASSWORD
        });
        token = res.data.token;
        log('Login successful!', 'success');
    } catch (error) {
        log(`Login failed: ${error.message}`, 'error');
        if (error.response) console.error(error.response.data);
        process.exit(1);
    }
}

async function testFlavors() {
    log('\n--- TESTING FLAVORS ---');
    const timestamp = Date.now();
    const flavorName = `Flavor ${timestamp}`;

    // 1. Create Active Flavor
    let flavorId;
    try {
        log(`Creating flavor: ${flavorName}`);
        const res = await axios.post(`${BASE_URL}/catalog/flavors`,
            { name: flavorName },
            { headers: { Authorization: `Bearer ${token}` } }
        );
        flavorId = res.data.id;
        if (!flavorId) throw new Error("No ID returned");
        log(`Flavor created with ID: ${flavorId}`, 'success');
    } catch (e) {
        log(`Create Flavor failed: ${e.message}`, 'error');
        throw e;
    }

    // 2. Verify it appears in list
    try {
        log('Fetching flavors (default active only)...');
        const res = await axios.get(`${BASE_URL}/catalog/flavors`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const found = res.data.find(f => f.id === flavorId);
        if (found) log('Flavor found in list', 'success');
        else throw new Error('Flavor NOT found in active list');
    } catch (e) {
        log(`Get Flavors failed: ${e.message}`, 'error');
        throw e;
    }

    // 3. Deactivate Flavor
    try {
        log(`Deactivating flavor ${flavorId}...`);
        // Note: New endpoint we will implement
        const res = await axios.patch(`${BASE_URL}/catalog/flavors/${flavorId}/active`,
            { isActive: false },
            { headers: { Authorization: `Bearer ${token}` } }
        );
        if (res.data.isActive === false) log('Flavor deactivated successfully', 'success');
        else throw new Error('Flavor isActive is not false');
    } catch (e) {
        log(`Deactivate Flavor failed: ${e.message}`, 'error');
        // If 404/405, it means endpoint not implemented yet
        if (e.response && e.response.status === 404) log("Endpoint not found (Expected for TDD phase 1)", 'info');
        else throw e;
    }

    // 4. Verify it does NOT appear in default list
    try {
        log('Fetching active flavors again...');
        const res = await axios.get(`${BASE_URL}/catalog/flavors`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const found = res.data.find(f => f.id === flavorId);
        if (!found) log('Flavor correctly HIDDEN from active list', 'success');
        else log('Flavor STILL VISIBLE in active list (Expected failure if filter not implemented)', 'error');
    } catch (e) {
        log(`Get Flavors check failed: ${e.message}`, 'error');
    }

    // 5. Verify it DOES appear with includeInactive=1
    try {
        log('Fetching ALL flavors (includeInactive=1)...');
        const res = await axios.get(`${BASE_URL}/catalog/flavors?includeInactive=1`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const found = res.data.find(f => f.id === flavorId);
        if (found) log('Flavor found in ALL list', 'success');
        else log('Flavor NOT found in ALL list (Expected if param not implemented)', 'error');
    } catch (e) {
        log(`Get All Flavors check failed: ${e.message}`, 'error');
    }
}

async function testFillings() {
    log('\n--- TESTING FILLINGS ---');
    const timestamp = Date.now();
    const fillingName = `Filling ${timestamp}`;

    // 1. Create Active Filling
    let fillingId;
    try {
        log(`Creating filling: ${fillingName}`);
        const res = await axios.post(`${BASE_URL}/catalog/fillings`,
            { name: fillingName },
            { headers: { Authorization: `Bearer ${token}` } }
        );
        fillingId = res.data.id;
        if (!fillingId) throw new Error("No ID returned");
        log(`Filling created with ID: ${fillingId}`, 'success');
    } catch (e) {
        log(`Create Filling failed: ${e.message}`, 'error');
        throw e;
    }

    // 2. Verify it appears in list
    try {
        log('Fetching fillings (default active only)...');
        const res = await axios.get(`${BASE_URL}/catalog/fillings`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const found = res.data.find(f => f.id === fillingId);
        if (found) log('Filling found in list', 'success');
        else throw new Error('Filling NOT found in active list');
    } catch (e) {
        log(`Get Fillings failed: ${e.message}`, 'error');
        throw e;
    }

    // 3. Deactivate Filling
    try {
        log(`Deactivating filling ${fillingId}...`);
        const res = await axios.patch(`${BASE_URL}/catalog/fillings/${fillingId}/active`,
            { isActive: false },
            { headers: { Authorization: `Bearer ${token}` } }
        );
        if (res.data.isActive === false) log('Filling deactivated successfully', 'success');
        else throw new Error('Filling isActive is not false');
    } catch (e) {
        log(`Deactivate Filling failed: ${e.message}`, 'error');
        if (e.response && e.response.status === 404) log("Endpoint not found (Expected)", 'info');
    }
}

async function run() {
    await login();
    try {
        log('Checking API root...');
        try {
            const rootRes = await axios.get(`${BASE_URL}/`);
            console.log('API Root Response:', rootRes.data);
        } catch (e) {
            console.error('API Root failed:', e.message);
        }

        log('Checking GET /catalog/flavors...');
        try {
            const getRes = await axios.get(`${BASE_URL}/catalog/flavors`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('GET Flavors Response Status:', getRes.status);
            console.log('GET Flavors Data Length:', getRes.data.length);
        } catch (e) {
            console.error('GET Flavors failed:', e.message);
            if (e.response) console.error('Response:', e.response.status, e.response.statusText, e.response.data);
        }

        await testFlavors();
        await testFillings();
        log('\nTests Completed!', 'info');
    } catch (e) {
        log('\nTests halted due to critical error.', 'error');
        if (e.response) console.error('Full connection error data:', e.response.data);
    }
}

run();
