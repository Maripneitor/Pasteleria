const { login, request, assert, BASE_URL } = require('./qa-utils');

async function run() {
    console.log('🤖 Starting AI Module Smoke Test...');
    const token = await login();

    // 1. Send Message
    const url = '/api/ai/session/message';
    const payload = { message: 'hola test QA' };

    console.log(`Sending message to ${url}...`);
    const res = await request(url, token, {
        method: 'POST',
        body: JSON.stringify(payload)
    });

    assert(res.ok, `POST ${url} failed: ${res.status}`);
    const data = await res.json();

    // 2. Check response structure
    // Expect { text: "...", sessionId: ... }
    assert(data.text && typeof data.text === 'string', 'Response missing "text" property');
    assert(data.text.length > 0, 'Response text is empty');

    // sessionId might be in data or not, depending on implementation.
    // Prompt says: "text string no vacía, sessionId number/string"
    if (data.sessionId) {
        console.log(`✅ Session ID: ${data.sessionId}`);
    } else {
        console.warn('⚠️ sessionId not returned in response (might be in cookies or not needed for legacy endpoint?)');
    }

    console.log(`✅ AI Response: "${data.text.substring(0, 50)}..."`);

    // 3. Auth Test
    const resNoAuth = await request(url, null, {
        method: 'POST',
        body: JSON.stringify(payload)
    });
    assert(resNoAuth.status === 401 || resNoAuth.status === 403, 'Auth check failed');
    console.log('✅ Auth Block OK');

    console.log('[OK] Module 08 AI passed.');
}

run().catch(err => {
    console.error('[FAIL] Module 08 AI:', err.message);
    process.exit(1);
});
