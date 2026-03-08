/**
 * whatsapp-gateway.js
 *
 * WhatsApp Gateway module using whatsapp-web.js.
 * This file acts as a singleton that manages the WA client session
 * and exposes a read-only status interface for the backend API.
 *
 * In Docker, this same codebase is also used as a standalone worker
 * (docker-compose service "whatsapp") via: `node whatsapp-gateway.js`
 */

const fs = require('fs');
const path = require('path');

const STATUS_FILE = path.join(__dirname, 'whatsapp_status.json');

// Internal state
let _state = {
    status: 'initializing', // 'initializing' | 'qr' | 'ready' | 'disconnected' | 'error'
    qr: null,
    timestamp: Date.now()
};

function _persistStatus() {
    try {
        fs.writeFileSync(STATUS_FILE, JSON.stringify(_state), 'utf-8');
    } catch (e) {
        console.error('[WA-Gateway] Could not write status file:', e.message);
    }
}

function _loadStatus() {
    try {
        if (fs.existsSync(STATUS_FILE)) {
            const data = JSON.parse(fs.readFileSync(STATUS_FILE, 'utf-8'));
            _state = { ..._state, ...data };
        }
    } catch (e) {
        console.warn('[WA-Gateway] Could not read status file:', e.message);
    }
}

// -----------------------------------------------------------
// PUBLIC API (used by whatsapp.controller.js)
// -----------------------------------------------------------

/** Returns the current WA gateway status (safe copy) */
function getStatus() {
    return { ..._state };
}

/** Restarts the WA client session */
async function restart() {
    _state.status = 'initializing';
    _state.qr = null;
    _state.timestamp = Date.now();
    _persistStatus();

    // Only run the actual WA client when this file is launched directly as a worker.
    // When imported as a module inside the API, only expose the status interface.
    if (require.main !== module) {
        console.log('[WA-Gateway] Restart requested, but running as module. Worker will handle reconnection.');
        return;
    }
    await _startClient();
}

// -----------------------------------------------------------
// WORKER MODE  (node whatsapp-gateway.js)
// -----------------------------------------------------------

async function _startClient() {
    let Client, LocalAuth;
    try {
        ({ Client, LocalAuth } = require('whatsapp-web.js'));
    } catch (e) {
        console.error('[WA-Gateway] whatsapp-web.js not found. Exiting worker.', e.message);
        process.exit(1);
    }

    const puppeteerOptions = {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    };

    if (process.env.PUPPETEER_EXECUTABLE_PATH) {
        puppeteerOptions.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
    }

    const client = new Client({
        authStrategy: new LocalAuth({ dataPath: path.join(__dirname, '.wwebjs_auth') }),
        puppeteer: puppeteerOptions
    });

    client.on('qr', (qr) => {
        console.log('[WA-Gateway] QR received');
        _state = { status: 'qr', qr, timestamp: Date.now() };
        _persistStatus();
    });

    client.on('ready', () => {
        console.log('[WA-Gateway] ✅ WhatsApp client ready!');
        _state = { status: 'ready', qr: null, timestamp: Date.now() };
        _persistStatus();
    });

    client.on('authenticated', () => {
        console.log('[WA-Gateway] Authenticated!');
    });

    client.on('auth_failure', (msg) => {
        console.error('[WA-Gateway] Auth failure:', msg);
        _state = { status: 'error', qr: null, timestamp: Date.now() };
        _persistStatus();
    });

    client.on('disconnected', (reason) => {
        console.warn('[WA-Gateway] Disconnected:', reason);
        _state = { status: 'disconnected', qr: null, timestamp: Date.now() };
        _persistStatus();
        // Auto-reconnect after 5s
        setTimeout(_startClient, 5000);
    });

    try {
        await client.initialize();
    } catch (e) {
        console.error('[WA-Gateway] Failed to initialize:', e.message);
        _state = { status: 'error', qr: null, timestamp: Date.now() };
        _persistStatus();
        setTimeout(_startClient, 10000);
    }
}

// Load from disk on startup so the API always has last-known state
_loadStatus();

// If run directly as CLI worker, start the WA client
if (require.main === module) {
    console.log('[WA-Gateway] Running as standalone worker...');
    _startClient();
}

module.exports = { getStatus, restart };
