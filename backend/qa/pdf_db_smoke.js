const { generateComandaPdf, generateNotaVentaPdf } = require('../services/pdfService');
const fs = require('fs');
const path = require('path');
const { sequelize } = require('../models');

async function run() {
    // Check Env
    if (!process.env.TEST_ORDER_ID || !process.env.TEST_TENANT_ID) {
        console.error('❌ Falta env: TEST_ORDER_ID o TEST_TENANT_ID');
        console.error('Uso: TEST_ORDER_ID=1 TEST_TENANT_ID=1 node backend/qa/pdf_db_smoke.js');
        process.exit(1);
    }

    const orderId = process.env.TEST_ORDER_ID;
    const ctx = {
        tenantId: process.env.TEST_TENANT_ID,
        branchId: process.env.TEST_BRANCH_ID || null, // Optional
        role: 'SUPER_ADMIN' // Bypass branch check for smoke test simplicity
    };

    console.log(`🚀 Iniciando DB PDF Smoke Test para Pedido #${orderId} (Tenant ${ctx.tenantId})...`);

    const outDir = path.join(__dirname, '../pdf_db_out');
    if (!fs.existsSync(outDir)) {
        fs.mkdirSync(outDir, { recursive: true });
    }

    try {
        // Init DB
        await sequelize.authenticate();

        // 1. Comanda
        console.log('📄 Generando Comanda (DB)...');
        const bufferComanda = await generateComandaPdf(orderId, ctx);
        const p1 = path.join(outDir, `comanda_${orderId}.pdf`);
        fs.writeFileSync(p1, bufferComanda);
        console.log(`✅ PDF Comanda DB OK (${bufferComanda.length} bytes) -> ${p1}`);

        // 2. Nota
        console.log('📄 Generando Nota Venta (DB)...');
        const bufferNota = await generateNotaVentaPdf(orderId, ctx);
        const p2 = path.join(outDir, `nota_${orderId}.pdf`);
        fs.writeFileSync(p2, bufferNota);
        console.log(`✅ PDF Nota DB OK (${bufferNota.length} bytes) -> ${p2}`);

        process.exit(0);

    } catch (e) {
        console.error('❌ Error detallado:', e);
        if (e.message.includes('No such file')) console.error('  -> Verifica que renderPdf use los paths correctos para templates');
        process.exit(1);
    }
}

run();
