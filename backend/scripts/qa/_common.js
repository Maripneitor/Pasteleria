const fs = require('fs');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@gmail.com'; // Default based on seed
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin1234';

async function login() {
    try {
        const res = await fetch(`${BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
        });
        if (!res.ok) throw new Error(`Login failed: ${res.statusText}`);
        const data = await res.json();
        return data.token;
    } catch (e) {
        console.error("FATAL: Could not login for QA.", e);
        process.exit(1);
    }
}

async function authenticatedFetch(path, options = {}) {
    const token = await login();
    const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers
    };
    return fetch(`${BASE_URL}${path}`, { ...options, headers });
}

function assert(condition, message) {
    if (!condition) {
        console.error(`[FAIL] ${message}`);
        process.exit(1);
    } else {
        console.log(`[OK] ${message}`);
    }
}

module.exports = { login, authenticatedFetch, assert, BASE_URL };
