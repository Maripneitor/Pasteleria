
const axios = require('axios');
const fs = require('fs');

const BASE_URL = 'http://localhost:3002/api';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@gmail.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin1234';

let token;

async function login() {
    try {
        const res = await axios.post(`${BASE_URL}/auth/login`, {
            email: ADMIN_EMAIL,
            password: ADMIN_PASSWORD
        });
        token = res.data.token;
        console.log('✅ Login successful');
    } catch (e) {
        console.error('❌ Login failed:', e.message);
        process.exit(1);
    }
}

async function verifyCommissionPdf() {
    console.log('\nTEST: Verify Commission PDF Generation');
    const today = new Date().toISOString().split('T')[0];
    try {
        const res = await axios.get(`${BASE_URL}/commissions/report/pdf`, {
            headers: { Authorization: `Bearer ${token}` },
            params: { from: today, to: today },
            responseType: 'arraybuffer' // Important for binary
        });

        if (res.headers['content-type'] === 'application/pdf' && res.data.length > 100) {
            console.log(`✅ PDF Generated (${res.data.length} bytes)`);
            fs.writeFileSync('test-commissions.pdf', res.data);
            console.log('   Saved to test-commissions.pdf for manual inspection');
        } else {
            console.error('❌ Response is not valid PDF');
            console.log('Headers:', JSON.stringify(res.headers, null, 2));
            console.log('Data Length:', res.data.length);
            if (res.data.length < 500) {
                console.log('Body:', res.data.toString());
            }
        }
    } catch (e) {
        if (e.response) {
            console.error(`❌ PDF Fail: ${e.response.status}`, e.response.data.toString());
        } else {
            console.error('❌ PDF Network Error:', e.message);
        }
    }
}

async function run() {
    await login();
    await verifyCommissionPdf();
}

run();
