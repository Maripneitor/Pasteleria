const { renderPdf } = require('../services/pdfRenderer');
const fs = require('fs');
const path = require('path');

async function run() {
    console.log('🚀 Iniciando PDF Smoke Test Local...');

    const outDir = path.join(__dirname, '../pdf');
    if (!fs.existsSync(outDir)) {
        fs.mkdirSync(outDir, { recursive: true });
    }

    // MOCK DATA
    const mockBranding = {
        businessName: 'Pastelería Demo',
        primaryColor: '#ec4899',
        logoUrl: 'https://via.placeholder.com/150', // Puppeteer might block this if we block http, but let's see. 
        // Actually we blocked http in renderer. So this logo won't show.
        // We should use a data URI for the test to be realistic if we want it to show.
        // Or we rely on the renderer allowing data uris.
        // For this test, let's use a text fallback or ignore missing image.
        footerText: 'Gracias por su compra - SUCURSAL NORTE'
    };

    const mockFolio = {
        folioNumber: 'TEST-001',
        folioType: 'Base/Especial',
        shape: 'Redondo',
        persons: '20',
        formattedDeliveryDate: '10/10/2026',
        formattedDeliveryTime: '14:00',
        createdAt: new Date().toISOString(),
        isPaid: false,
        status: 'CONFIRMED',
        client: {
            name: 'Juan Pérez',
            phone: '555-1234',
            email: 'juan@test.com'
        },
        deliveryLocation: 'Sucursal Centro',
        sabores: ['Vainilla', 'Chocolate'],
        rellenos: ['Fresa Premium'],
        cubierta: 'Merengue',
        tiers: [
            { persons: 10, panes: ['Vainilla'], rellenos: ['Fresa'], notas: 'Piso base' },
            { persons: 10, panes: ['Chocolate'], rellenos: ['Nuez'], notas: 'Piso arriba' }
        ],
        designDescription: 'Decoración con flores azules y chispas doradas.',
        dedication: 'Feliz Cumpleaños',
        total: 1250.00,
        advancePayment: 500.00,
        balance: 750.00,
        basePrice: 1100.00,
        deliveryCost: 150.00,
        additionals: [
            { name: 'Vela mágica', price: 50.00 }
        ]
    };

    try {
        // 1. Generate Comanda
        console.log('📄 Generando Comanda...');
        const comandaBuffer = await renderPdf({
            templateName: 'comanda',
            data: { folio: mockFolio },
            branding: mockBranding,
            options: { format: 'A4' }
        });

        const comandaPath = path.join(outDir, 'test_comanda.pdf');
        fs.writeFileSync(comandaPath, comandaBuffer);
        console.log(`✅ PDF Comanda OK (bytes=${comandaBuffer.length}) -> ${comandaPath}`);
        if (comandaBuffer.length < 1000) throw new Error('Comanda PDF too small');

        // 2. Generate Nota Venta
        console.log('📄 Generando Nota Venta...');
        const notaBuffer = await renderPdf({
            templateName: 'nota-venta',
            data: { folio: mockFolio },
            branding: mockBranding,
            options: { format: 'A4' } // Could test 'ticket' width here too
        });

        const notaPath = path.join(outDir, 'test_nota.pdf');
        fs.writeFileSync(notaPath, notaBuffer);
        console.log(`✅ PDF Nota OK (bytes=${notaBuffer.length}) -> ${notaPath}`);
        if (notaBuffer.length < 1000) throw new Error('Nota PDF too small');

        process.exit(0);

    } catch (error) {
        console.error('❌ Error en Smoke Test PDF:', error);
        process.exit(1);
    }
}

run();
