const puppeteer = require('puppeteer');

const FRONTEND_URL = 'http://localhost:5173';
const API_URL = 'http://localhost:3000';
const EMAIL = 'admin@gmail.com';
const PASSWORD = 'Admin1234';

(async () => {
    try {
        const health = await fetch(API_URL + '/api/health').then(r => r.json()).catch(e => ({ error: e.message }));
        console.log('Backend Health:', health);
    } catch (e) {
        console.log('Backend Health Check Failed:', e.message);
    }

    console.log('🚀 Starting Frontend Folios Smoke Test...');
    const browser = await puppeteer.launch({
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));


    try {
        // 1. Login
        console.log('🔑 Logging in...');
        await page.goto(`${FRONTEND_URL}/login`);
        await page.type('input[type="email"]', EMAIL);
        await page.type('input[type="password"]', PASSWORD);

        await Promise.all([
            page.waitForNavigation({ waitUntil: 'networkidle0' }),
            page.click('form button')
        ]);
        console.log('✅ Login successful');

        const token = await page.evaluate(() => localStorage.getItem('token'));
        console.log('Token in localStorage:', token ? 'YES' : 'NO');


        // 2. Go to Folios Page
        console.log('📂 Navigating to /pedidos...');
        await page.goto(`${FRONTEND_URL}/pedidos`);
        await page.waitForSelector('h1', { timeout: 5000 });

        const title = await page.$eval('h1', el => el.textContent);
        if (!title.includes('Mis Pedidos')) throw new Error('Page title mismatch');
        console.log('✅ Folios Page loaded');

        // 3. Start New Order Wizard
        console.log('✨ Starting New Order Wizard...');
        // Find "Nuevo Pedido" button. It contains "Nuevo Pedido" text.
        const [newOrderBtn] = await page.$x("//button[contains(., 'Nuevo Pedido')]");
        if (newOrderBtn) {
            await newOrderBtn.click();
        } else {
            // Try direct navigation if button search fails (though it should work)
            await page.goto(`${FRONTEND_URL}/pedidos/nuevo`);
        }

        await page.waitForSelector('h1', { timeout: 5000 });
        const wizardTitle = await page.$eval('h1', el => el.textContent);
        if (!wizardTitle.includes('Nuevo Pedido')) throw new Error('Wizard title mismatch');
        console.log('✅ Wizard loaded');

        // 4. Wizard Steps
        // Step 1: Client
        console.log('📝 Filling Step 1: Client...');
        await page.type('input[placeholder*="Juan"]', 'Smoke Test User');
        await page.type('input[placeholder*="55"]', '5555555555');
        await page.click('button.bg-pink-500'); // Next button
        await new Promise(r => setTimeout(r, 500)); // Animation

        // Step 2: Product
        console.log('🎂 Filling Step 2: Product...');
        // Inputs are general, select by order or placeholder
        const inputs = await page.$$('input[type="text"]');
        if (inputs.length > 0) await inputs[0].type('Vainilla Smoke'); // Flavor
        if (inputs.length > 1) await inputs[1].type('Chocolate Smoke'); // Filling

        await page.type('textarea', 'Diseño de prueba automatizada');

        // Find Next button (it's the second button in the group usually, or check text)
        const buttons = await page.$$('button.bg-pink-500');
        await buttons[0].click(); // Next
        await new Promise(r => setTimeout(r, 500));

        // Step 3: Delivery
        console.log('🚚 Filling Step 3: Delivery...');
        // Date input
        await page.type('input[type="date"]', new Date().toISOString().split('T')[0]);
        await page.type('input[type="time"]', '14:00');

        const nextBtns3 = await page.$$('button.bg-pink-500');
        await nextBtns3[0].click(); // Next
        await new Promise(r => setTimeout(r, 500));

        // Step 4: Summary & Submit
        console.log('💰 Filling Step 4: Summary & Submit...');
        await page.type('input[type="number"]', '500'); // Total

        // Click Finalizar (Green button)
        const finishBtn = await page.$('button.bg-green-600');
        if (!finishBtn) throw new Error('Finish button not found');

        await Promise.all([
            page.waitForNavigation({ waitUntil: 'networkidle0' }),
            finishBtn.click()
        ]);
        console.log('✅ Order Submitted');

        // 5. Verify Detail Page
        console.log('📄 Verifying Detail Page...');
        const url = page.url();
        if (!url.includes('/folios/')) throw new Error(`Not on folio detail page: ${url}`);

        await page.waitForSelector('h1', { timeout: 5000 });
        const detailTitle = await page.$eval('h1', el => el.textContent);
        if (!detailTitle.includes('Folio #')) throw new Error('Detail title mismatch');

        // Check for PDF Buttons
        const comandaBtn = await page.$x("//button[contains(., 'Ver Comanda')]");
        const notaBtn = await page.$x("//button[contains(., 'Ver Nota')]");

        if (comandaBtn.length === 0) throw new Error('Comanda button missing');
        if (notaBtn.length === 0) throw new Error('Nota button missing');

        console.log('✅ Detail Page Verified with PDF Buttons');

        console.log('🎉 Frontend Folios Smoke Test Passed!');

    } catch (error) {
        console.error('❌ Smoke Test Failed:', error);
        process.exit(1);
    } finally {
        await browser.close();
    }
})();
