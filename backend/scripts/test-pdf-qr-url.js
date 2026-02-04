const QRCode = require('qrcode');
const { renderFolioPdf } = require('../services/pdfService');

// Mock Dependencies to isolate QR logic
jest = { fn: (impl) => impl }; // Simple mock helper conceptual
// We can't actually use jest here, we are running node directly.
// We need to Intercept require or Mock QRCode.toDataURL method.
// Since modules are cached, we can modify the exported method of 'qrcode' IF we require it first.

// Setup Mock
const originalToDataURL = QRCode.toDataURL;
let lastUrl = '';

QRCode.toDataURL = async (text) => {
    lastUrl = text;
    return 'data:image/png;base64,mock';
};

// Mock Puppeteer to avoid launching browser
const puppeteer = require('puppeteer');
puppeteer.launch = async () => ({
    newPage: async () => ({
        setContent: async () => { },
        pdf: async () => Buffer.from('mock-pdf')
    }),
    close: async () => { }
});

async function runTest() {
    console.log('🧪 Testing QR URL Configurability...');

    // TEST 1: Default Fallback
    delete process.env.PUBLIC_APP_URL;
    process.env.PUBLIC_APP_URL = ''; // Ensure empty

    await renderFolioPdf({ folio: { id: 123 }, watermark: 'TEST' });
    console.log(`[Default] URL used: ${lastUrl}`);

    if (lastUrl === 'http://localhost:5173/folios/123') {
        console.log('✅ Default fallback correct.');
    } else {
        console.error('❌ Default fallback FAILED.');
        process.exit(1);
    }

    // TEST 2: Custom ENV
    process.env.PUBLIC_APP_URL = 'https://pasteleria-demo.com';

    await renderFolioPdf({ folio: { id: 999 }, watermark: 'TEST' });
    console.log(`[Custom]  URL used: ${lastUrl}`);

    if (lastUrl === 'https://pasteleria-demo.com/folios/999') {
        console.log('✅ Custom ENV variable correct.');
    } else {
        console.error('❌ Custom ENV variable FAILED.');
        process.exit(1);
    }

    console.log('✨ All tests passed.');

    // Cleanup
    QRCode.toDataURL = originalToDataURL;
}

runTest().catch(e => {
    console.error(e);
    process.exit(1);
});
