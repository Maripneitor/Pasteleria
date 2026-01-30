// server/scripts/qa/_auth.js
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const { requestJson, log } = require('./_http');

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

async function loginAndGetToken() {
    if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
        throw new Error('Missing ADMIN_EMAIL or ADMIN_PASSWORD in env');
    }

    log.info(`Authenticating as ${ADMIN_EMAIL}...`);

    try {
        const res = await requestJson({
            method: 'POST',
            url: '/api/auth/login',
            body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD }
        });

        if (res.status !== 200) {
            console.error('Login failed response:', JSON.stringify(res.data, null, 2));
            throw new Error(`Login failed with status ${res.status}`);
        }

        const token = res.data.token || res.data.access_token;
        if (!token || token.length < 20) {
            throw new Error('Invalid token received from login');
        }

        log.info('Authentication successful.');
        return token;
    } catch (err) {
        console.error('Authentication Error Object:', err);
        console.error('Authentication Error Message:', err.message);
        if (err.cause) console.error('Cause:', err.cause);
        throw err; // Re-throw to caller (verify_contract.js)
    }
}

module.exports = { loginAndGetToken };
