const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const { Tenant, PdfTemplate } = require('../../models');

const manualCheck = async () => {
    try {
        console.log('🔧 Creating Demo Tenant for PDF Test...');

        // 1. Upsert Tenant
        const [tenant] = await Tenant.upsert({
            id: 1,
            businessName: 'Pastelería Demo VIP',
            primaryColor: '#8b5cf6', // Purple
            logoUrl: 'https://via.placeholder.com/150/8b5cf6/FFFFFF?text=VIP',
            pdfHeaderText: 'Gracias por su preferencia - VIP',
            pdfFooterText: 'Este comprobante es una demostración.\nVisítenos en www.demovip.com'
        });
        console.log('✅ Tenant Upserted:', tenant.businessName);

        // 2. Mock Data for PDF Service call
        // We can't easily call pdfService directly without mocking folios and ejs.
        // Instead, we will count on the previous "verify_auth_scope" or "verify_activation"
        // confirming that the system runs.
        // For PDF specifically, we can use the "generate PDF" endpoint if we have one, 
        // or just rely on the Unit Test below.

        const pdfService = require('../../services/pdfService');
        const fs = require('fs');
        const path = require('path');

        const mockFolio = {
            id: 999,
            folio_numero: 'DEMO-999',
            tenantId: 1,
            fecha_entrega: '2026-12-31',
            hora_entrega: '14:00',
            estatus_produccion: 'Pendiente',
            cliente_nombre: 'Cliente Test',
            cliente_telefono: '555-555-5555',
            tipo_folio: 'Pastel',
            sabores_pan: ['Chocolate'],
            rellenos: ['Nuez'],
            numero_personas: '20',
            descripcion_diseno: 'Diseño de prueba con branding dinámico',
            total: 500,
            anticipo: 100
        };

        console.log('📄 Generating PDF Buffer with Tenant Config...');
        const buffer = await pdfService.renderFolioPdf({
            folio: mockFolio,
            watermark: 'PRUEBA',
            templateConfig: null // Should fetch from Tenant 1
        });

        const outputPath = path.join(__dirname, 'demo_folio.pdf');
        fs.writeFileSync(outputPath, buffer);
        console.log(`✅ PDF Generated at: ${outputPath}`);
        console.log('Please check the PDF manually to verify the Purple Color and "Pastelería Demo VIP" text.');

    } catch (e) {
        console.error('❌ PDF Test Failed:', e);
    }
};

(async () => {
    // Need DB connection logic here effectively or reuse from verify scripts
    // But easier to just run as standalone script requiring models/config
    require('../../models').sequelize.authenticate().then(manualCheck);
})();
