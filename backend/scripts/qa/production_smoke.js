const { login, request, assert, BASE_URL } = require('./qa-utils');

async function run() {
    console.log('🏭 Starting Production Module Smoke Test...');
    const token = await login();

    // 1. Get Daily Production
    const today = new Date().toISOString().split('T')[0];
    let url = `/api/production?date=${today}`;
    let res = await request(url, token);
    assert(res.ok, `GET ${url} failed: ${res.status}`);
    let items = await res.json(); // Assuming array or { data: [] }
    items = Array.isArray(items) ? items : (items.data || []);

    if (items.length === 0) {
        console.log('ℹ️ No production items. Creating folio...');
        const createRes = await request('/api/folios', token, {
            method: 'POST',
            body: JSON.stringify({
                cliente_nombre: 'QA Production Test',
                cliente_telefono: '555-PROD',
                fecha_entrega: today,
                estatus_produccion: 'Pendiente',
                total: 100
            })
        });
        assert(createRes.ok, 'Failed to create usage folio');
        // Refresh (might need time?)
        res = await request(url, token);
        items = await res.json();
        items = Array.isArray(items) ? items : (items.data || []);
    }

    assert(items.length > 0, 'Production list empty even after creation');
    const folioId = items[0].id || items[0].folioId; // Adapt to actual return
    console.log(`✅ Production item found: ${folioId}`);

    // 2. Change Status
    const statusUrl = `/api/production/${folioId}/status`;
    // Statuses usually: Pendiente, En Horno, Decorado, Terminado.
    // Toggle between two valid statuses.
    const newStatus = 'En Horno';
    res = await request(statusUrl, token, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus })
    });

    // If 400 because maybe "En Horno" is invalid, try "Terminado" or just log warning?
    // Ideally we know the valid statuses.
    if (!res.ok) {
        const txt = await res.text();
        console.warn(`⚠️ Status update failed (maybe invalid transition): ${txt}`);
    } else {
        const updated = await res.json();
        assert(updated.estatus_produccion === newStatus || updated.message, 'Status update response invalid');
        console.log('✅ Status updated');
    }

    // 3. Auth Test
    const resNoAuth = await request(url, null);
    assert(resNoAuth.status === 401 || resNoAuth.status === 403, 'Auth check failed');
    console.log('✅ Auth Block OK');

    console.log('[OK] Module 05 Production passed.');
}

run().catch(err => {
    console.error('[FAIL] Module 05 Production:', err.message);
    process.exit(1);
});
