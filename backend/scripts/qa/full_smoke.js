const axios = require('axios');

async function testBackend() {
    console.log("🔥 Starting Smoke Test...");

    const API_URL = 'http://localhost:3000/api/v1';

    // Login
    console.log(`\n🔑 Authenticating...`);
    let token;
    try {
        const res = await axios.post(`${API_URL}/auth/login`, {
            email: "owner@demo.com",
            password: "admin123"
        });
        token = res.data.token;
        console.log("✅ Authenticated. Token acquired.");
    } catch (e) {
        console.error("❌ Login failed:", e.response?.data || e.message);
        process.exit(1);
    }

    const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

    // 1. Create Folio
    console.log(`\n📄 Creating Folio...`);
    let folioId;
    try {
        const payload = {
            cliente_nombre: "Smoke Test User",
            cliente_telefono: "5555555555",
            fecha_entrega: new Date().toISOString().split('T')[0],
            hora_entrega: "10:00",
            total: 100,
            anticipo: 50,
            estatus_pago: "Pendiente",
            estatus_produccion: "Pendiente",
            tipo_folio: "Normal",
            sabores_pan: ["Vainilla"],
            rellenos: ["Fresa"],
            numero_personas: 10,
            forma: "Redondo",
            descripcion_diseno: "Test Design",
        };
        const res = await axios.post(`${API_URL}/folios`, payload, authHeaders);
        folioId = res.data.id;
        console.log(`✅ Folio Created: ID ${folioId}`);
    } catch (e) {
        console.error("❌ Folio Creation Failed:", e.response?.data || e.message);
    }

    // 2. Daily Cut (expected: may warn if no SMTP configured)
    console.log(`\n📧 Sending Daily Cut...`);
    try {
        const res = await axios.post(`${API_URL}/reports/daily-cut`, {
            date: new Date().toISOString().split('T')[0],
            email: "test@example.com",
            force: true
        }, authHeaders);
        console.log(`✅ Daily Cut Response:`, res.data);
    } catch (e) {
        console.warn(`⚠️  Daily Cut (non-critical - needs SMTP config):`, e.response?.data?.message || e.message);
    }

    // 3. PDF Endpoint Check
    console.log(`\n🖨 Checking PDF Endpoint...`);
    try {
        const pdfRes = await axios.get(`${API_URL}/folios/${folioId}/pdf`, {
            responseType: 'arraybuffer',
            ...authHeaders
        });
        console.log(`✅ PDF Download OK (${pdfRes.data.byteLength} bytes received).`);
    } catch (e) {
        console.error("❌ PDF Download Failed:", e.response?.data || e.message);
    }

    console.log("\n✅ Smoke Test Complete.");
}

testBackend();
