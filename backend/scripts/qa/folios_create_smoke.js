const axios = require('axios');
require('dotenv').config({ path: '../../.env' }); // Adjust path if running from server/scripts/qa

// Config
const API_URL = process.env.API_URL || 'http://localhost:3000/api';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@gmail.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin1234';

async function runSmokeTest() {
    console.log('🔵 [SMOKE TEST] Iniciando prueba de creación de Folios...');
    console.log(`   Target: ${API_URL}`);

    try {
        // 1. Auth Login
        console.log('\n🔐 Autenticando...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: ADMIN_EMAIL,
            password: ADMIN_PASSWORD
        });
        const token = loginRes.data.token;
        if (!token) throw new Error('No token received');
        console.log('✅ Auth exitoso. Token obtenido.');

        const headers = { Authorization: `Bearer ${token}` };

        // 2. Create Minimal Folio
        console.log('\n📄 Creando Folio Mínimo (JSON Puro)...');
        const payloadMin = {
            cliente_nombre: "Smoke Test Cliente",
            cliente_telefono: "5550001111",
            fecha_entrega: new Date().toISOString().split('T')[0], // Today
            hora_entrega: "10:00",
            total: 1500,
            sabores_pan: ["Vainilla"], // Should handle array
            tipo_folio: "Boda"
        };

        try {
            const resMin = await axios.post(`${API_URL}/folios`, payloadMin, { headers });
            console.log(`✅ [201] Folio creado ID: ${resMin.data.id} | Folio: ${resMin.data.folio_numero}`);
        } catch (err) {
            console.error(`❌ [${err.response?.status || '???'}] Falló creación mínima.`);
            console.error('Response:', err.response?.data);
            process.exit(1);
        }

        // 3. Create Complex Folio (simulate Multipart/Form-Data if needed, but sending json is easier for smoke)
        // In the controller, we handle both via `normalizeBody`.
        console.log('\n📄 Creando Folio Completo (con campos numéricos string)...');
        const payloadFull = {
            cliente_nombre: "Smoke Test Completo",
            cliente_telefono: "555-999-8888",
            fecha_entrega: new Date().toISOString().split('T')[0],
            hora_entrega: "18:00",

            // Numeric strings that might cause issues if parsed poorly
            costo_base: "1200",
            costo_envio: "50.50",
            anticipo: "500",
            total: "1250.50",

            // JSON fields
            sabores_pan: ["Chocolate", "Vainilla"],
            rellenos: ["Fresa"],

            estatus_pago: "Pendiente"
        };

        try {
            const resFull = await axios.post(`${API_URL}/folios`, payloadFull, { headers });
            console.log(`✅ [201] Folio Completo creado ID: ${resFull.data.id} | Balance: ${resFull.data.total}`);
        } catch (err) {
            console.error(`❌ [${err.response?.status}] Falló creación completa.`);
            console.error('Response:', err.response?.data);
        }

        console.log('\n✨ Smoke Test Finalizado.');

    } catch (error) {
        console.error('\n❌ FATAL ERROR:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        }
        process.exit(1);
    }
}

runSmokeTest();
