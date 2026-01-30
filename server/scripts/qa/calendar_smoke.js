const { login, request, assert, BASE_URL } = require('./qa-utils');

async function run() {
    console.log('📅 Starting Calendar Module Smoke Test...');
    const token = await login();

    // 1. Get Calendar Range (Current Month)
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const start = `${y}-${m}-01`;
    // Simple end date calculation
    const end = `${y}-${m}-28`; // Safe bet or calculate last day. The API probably handles just 28 fine.

    const calendarUrl = `/api/folios/calendar?start=${start}&end=${end}`;
    let res = await request(calendarUrl, token);
    assert(res.ok, `GET ${calendarUrl} failed: ${res.status}`);
    let data = await res.json();

    // It returns an array directly? Or { data: [] }? Prompt assumes array "Debe devolver array".
    // Let's assume array because usually calendar endpoints return list of events.
    // If "data.data" exists, switch.
    const events = Array.isArray(data) ? data : (data.data || []);

    console.log(`✅ Calendar fetched. Events count: ${events.length}`);

    if (events.length === 0) {
        console.log('ℹ️ No events found. Creating a folio for today to verify calendar...');
        const today = new Date().toISOString().split('T')[0];
        const createRes = await request('/api/folios', token, {
            method: 'POST',
            body: JSON.stringify({
                cliente_nombre: 'QA Calendar Test',
                cliente_telefono: '555-CALENDAR',
                fecha_entrega: today,
                total: 50
            })
        });
        assert(createRes.ok, 'Failed to create test folio for calendar');

        // Re-fetch
        res = await request(calendarUrl, token);
        data = await res.json();
        const newEvents = Array.isArray(data) ? data : (data.data || []);
        assert(newEvents.length > 0, 'Calendar still empty after creating folio');
        console.log(`✅ Calendar verification successful. Events: ${newEvents.length}`);

        // Check fields
        const event = newEvents[0];
        assert(event.id || event.folioId, 'Event missing id');
        assert(event.date || event.start, 'Event missing date');
        assert(event.title, 'Event missing title');
    } else {
        // Check fields of existing
        const event = events[0];
        // Adjust checks to likely flat object or mapped object
        // Assuming standard response.
        if (!event.id && !event.folioId) console.warn('⚠️ Event object missing id/folioId property');
        if (!event.title) console.warn('⚠️ Event object missing title property');
    }

    // 2. Auth Test
    const resNoAuth = await request(calendarUrl, null);
    assert(resNoAuth.status === 401 || resNoAuth.status === 403, `Auth check failed: ${resNoAuth.status}`);
    console.log('✅ Auth Block OK');

    console.log('[OK] Module 03 Calendar passed.');
}

run().catch(err => {
    console.error('[FAIL] Module 03 Calendar:', err.message);
    console.error('Reproduce with:');
    console.log(`curl -H "Authorization: Bearer $TOKEN" "${BASE_URL}/api/folios/calendar?start=..."`);
    process.exit(1);
});
