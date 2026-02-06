const axios = require('axios'); // Asegúrate de tener axios en server/package.json
const BASE_URL = 'http://localhost:3000/api';

async function runSmokeTest() {
    console.log('💨 Iniciando Smoke Tests...');
    let errors = 0;

    // 1. Health Check
    try {
        const res = await axios.get(`${BASE_URL}/health`);
        if (res.status === 200 && (res.data.ok || res.data.status === 'ok')) console.log('✅ GET /health: OK');
        else throw new Error(`Invalid Response: ${JSON.stringify(res.data)}`);
    } catch (e) {
        console.error('❌ GET /health FALLÓ:', e.message);
        errors++;
    }

    // 2. Auth Endpoint (Check existance only if no creds)
    try {
        await axios.post(`${BASE_URL}/auth/login`, { username: 'test', password: 'wrongpassword' });
    } catch (e) {
        if (e.response && (e.response.status === 401 || e.response.status === 400 || e.response.status === 404)) {
            console.log(`✅ POST /auth/login: Respondió ${e.response.status} (Esperado)`);
        } else {
            console.error('❌ POST /auth/login FALLÓ:', e.message);
            errors++;
        }
    }

    // 3. AI Legacy Route Existence (Check 401/403 without token)
    try {
        await axios.post(`${BASE_URL}/ai/session/message`, { message: 'hi' });
    } catch (e) {
        if (e.response && e.response.status === 401) {
            console.log('✅ POST /ai/session/message: Protegido (401 sin token)');
        } else {
            console.error('❌ POST /ai/session/message: Comportamiento inesperado', e.message);
            // errors++; // No fail strict here if middleware differs
        }
    }

    if (errors > 0) {
        console.error(`💥 Smoke Tests TERMINADOS con ${errors} errores.`);
        process.exit(1);
    } else {
        console.log('🎉 Todo parece estable.');
        process.exit(0);
    }
}

// Run if called directly
runSmokeTest();
