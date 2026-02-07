const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@gmail.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin1234';
const FOLIO_ID = process.env.FOLIO_ID;
const DOWNLOAD = process.env.DOWNLOAD === 'true';

if (!FOLIO_ID) {
    console.error('❌ Error: FOLIO_ID env var is required.');
    console.error('Usage: FOLIO_ID=123 node backend/qa/test_api_pdf.js');
    process.exit(1);
}

async function run() {
    console.log(`🚀 PDF API Smoke Test (Target: ${FOLIO_ID})...`);

    // 1. Authenticate
    let token = null;
    const loginPayload = { email: ADMIN_EMAIL, password: ADMIN_PASSWORD };

    // Try standard auth endpoints
    const authEndpoints = ['/api/auth/login', '/auth/login', '/api/login'];

    for (const endpoint of authEndpoints) {
        try {
            console.log(`Trying login at ${endpoint}...`);
            const res = await fetch(`${BASE_URL}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(loginPayload)
            });

            if (res.ok) {
                const data = await res.json();
                token = data.token || data.accessToken || (data.data && data.data.token);
                if (token) {
                    console.log('✅ Login OK');
                    break;
                }
            }
        } catch (e) { /* ignore connection refused etc for now */ }
    }

    if (!token) {
        console.error('❌ Login Failed. Could not obtain token.');
        process.exit(1);
    }

    const headers = { 'Authorization': `Bearer ${token}` };
    const outDir = path.join(__dirname, '../pdf');
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

    // 2. Test Comanda PDF
    try {
        const url = `${BASE_URL}/api/folios/${FOLIO_ID}/pdf/comanda?download=${DOWNLOAD}`;
        console.log(`GET ${url}`);
        const res = await fetch(url, { headers });

        if (res.status === 200 && res.headers.get('content-type').includes('application/pdf')) {
            const buffer = await res.arrayBuffer();
            const pdfData = Buffer.from(buffer);
            if (pdfData.length > 1000) {
                const outfile = path.join(outDir, `api_comanda_${FOLIO_ID}.pdf`);
                fs.writeFileSync(outfile, pdfData);
                console.log(`✅ API PDF Comanda OK (bytes=${pdfData.length}) -> ${outfile}`);
            } else {
                console.error(`❌ PDF Comanda too small: ${pdfData.length} bytes`);
                process.exit(1);
            }
        } else {
            console.error(`❌ PDF Comanda Error: ${res.status} ${res.statusText}`);
            console.error(await res.text());
            process.exit(1);
        }
    } catch (e) {
        console.error('❌ Network Error (Comanda):', e);
        process.exit(1);
    }

    // 3. Test Nota PDF
    try {
        const url = `${BASE_URL}/api/folios/${FOLIO_ID}/pdf/nota?download=${DOWNLOAD}`;
        console.log(`GET ${url}`);
        const res = await fetch(url, { headers });

        if (res.status === 200 && res.headers.get('content-type').includes('application/pdf')) {
            const buffer = await res.arrayBuffer();
            const pdfData = Buffer.from(buffer);
            if (pdfData.length > 1000) {
                const outfile = path.join(outDir, `api_nota_${FOLIO_ID}.pdf`);
                fs.writeFileSync(outfile, pdfData);
                console.log(`✅ API PDF Nota OK (bytes=${pdfData.length}) -> ${outfile}`);
            } else {
                console.error(`❌ PDF Nota too small: ${pdfData.length} bytes`);
                process.exit(1);
            }
        } else {
            console.error(`❌ PDF Nota Error: ${res.status} ${res.statusText}`);
            console.error(await res.text());
            process.exit(1);
        }
    } catch (e) {
        console.error('❌ Network Error (Nota):', e);
        process.exit(1);
    }

    console.log('🎉 All API PDF Tests Passed!');
}

run();
