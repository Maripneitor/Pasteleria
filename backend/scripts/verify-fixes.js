
const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';
// Assuming we have a valid token or login helper from previous tests
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

async function verifyPdfProtection() {
    console.log('\nTEST: Verify PDF Protection (Buffer Check)');
    // We try to fetch a PDF for a non-existent ID to ensure 404 JSON (not HTML or empty)
    try {
        await axios.get(`${BASE_URL}/folios/99999999/pdf`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.error('❌ Expected 404/500 for invalid ID, got success');
    } catch (e) {
        if (e.response && e.response.status === 404 && e.response.headers['content-type'].includes('application/json')) {
            console.log('✅ Invalid ID returns 404 JSON (good)');
        } else {
            console.log(`⚠️ received status ${e.response?.status}, content-type: ${e.response?.headers['content-type']}`);
        }
    }
}

async function verifyEmailError() {
    console.log('\nTEST: Verify SMTP Error Logic');
    try {
        await axios.post(`${BASE_URL}/reports/daily-cut`,
            { date: '2025-01-01', branches: ['Test'], email: 'invalid@test.com' },
            { headers: { Authorization: `Bearer ${token}` } }
        );
        console.log('⚠️ Email sent? Unexpected if SMTP invalid.');
    } catch (e) {
        const data = e.response?.data;
        if (data && data.details && (data.details.includes('SMTP') || data.details.includes('autenticación'))) {
            console.log('✅ Backend returned SMTP details correctly:', data.details);
        } else {
            console.error('❌ Backend returned generic error or 500 without details:', data);
        }
    }
}

async function run() {
    await login();
    await verifyPdfProtection();
    await verifyEmailError();
}

run();
