const fs = require('fs');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@gmail.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin1234';

async function login() {
    try {
        const res = await fetch(`${BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
        });

        if (!res.ok) {
            const text = await res.text();
            throw new Error(`Login failed: ${res.status} ${text}`);
        }

        const data = await res.json();
        if (!data.token) throw new Error('No token returned from login');
        return data.token;
    } catch (error) {
        console.error('❌ Login Error:', error.message);
        process.exit(1);
    }
}

function assert(condition, message) {
    if (!condition) {
        console.error(`❌ Assertion Failed: ${message}`);
        process.exit(1);
    }
}

async function request(path, token, options = {}) {
    const headers = { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers };
    const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
    return res;
}

module.exports = { login, request, assert, BASE_URL };
