// scripts/qa/test_api_pdf.js
const fs = require('fs');

async function run() {
    console.log("🧪 Testing PDF Generation...");

    // Login
    const loginRes = await fetch('http://backend:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'empleado@demo.com', password: 'admin123' })
    });
    const { token } = await loginRes.json();

    // We need a Folio ID. Fetch latest.
    const listRes = await fetch('http://backend:3000/api/folios', {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const folios = await listRes.json();

    if (folios.length > 0) {
        const id = folios[0].id; // Use first found
        const pdfRes = await fetch(`http://backend:3000/api/folios/${id}/pdf`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (pdfRes.status === 200) {
            const buffer = await pdfRes.arrayBuffer();
            if (!fs.existsSync('pdf_db_out')) fs.mkdirSync('pdf_db_out');
            fs.writeFileSync(`pdf_db_out/folio_${id}.pdf`, Buffer.from(buffer));
            console.log(`✅ PDF Generated and saved to pdf_db_out/folio_${id}.pdf`);
        } else {
            console.error(`❌ PDF Generation Failed: ${pdfRes.status}`);
        }
    } else {
        console.log("⚠️ No folios to test PDF.");
    }
}
run();
