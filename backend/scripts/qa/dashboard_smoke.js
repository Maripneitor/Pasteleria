const { login, request, assert, BASE_URL } = require('./qa-utils');

async function run() {
    console.log('📊 Starting Dashboard Module Smoke Test...');
    const token = await login();

    // 1. Get Dashboard Stats
    const dashboardUrl = '/api/folios/stats/dashboard';
    const res = await request(dashboardUrl, token);
    assert(res.ok, `GET ${dashboardUrl} failed: ${res.status}`);
    const stats = await res.json();

    // 2. Check basics
    // Expecting keys like totalOrders, revenue, etc.
    console.log('Stats received:', Object.keys(stats));
    assert(Object.keys(stats).length > 0, 'Stats object is empty');

    // Check for some numeric value
    // Depending on implementation it might be "totalFolios", "ingresosHoy", etc.
    // Just checking "not NaN" for values that look like numbers.
    let numberFound = false;
    for (const key in stats) {
        if (typeof stats[key] === 'number' || !isNaN(parseFloat(stats[key]))) {
            numberFound = true;
            break;
        }
    }
    assert(numberFound, 'No numeric stats found');
    console.log('✅ Dashboard stats contain numbers');

    // 3. User check if exists
    // /api/users usually for admin
    const usersRes = await request('/api/users', token);
    if (usersRes.ok) { // Only if accessible
        const users = await usersRes.json();
        assert(Array.isArray(users), '/api/users did not return array');
        console.log('✅ Users list accessible');
    }

    // 4. Auth Test
    const resNoAuth = await request(dashboardUrl, null);
    assert(resNoAuth.status === 401 || resNoAuth.status === 403, `Auth check failed: ${resNoAuth.status}`);
    console.log('✅ Auth Block OK');

    console.log('[OK] Module 04 Dashboard passed.');
}

run().catch(err => {
    console.error('[FAIL] Module 04 Dashboard:', err.message);
    process.exit(1);
});
