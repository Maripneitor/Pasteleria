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
const axios = require('axios'); // <-- Agrega esta línea

const STATUS_FILE = path.join(__dirname, 'whatsapp_status.json');

// Internal state
let _state = {
    status: 'initializing', // 'initializing' | 'qr' | 'ready' | 'disconnected' | 'error'
    qr: null,
    timestamp: Date.now()
};

// WhatsApp Client Instance (Global para poder enviar mensajes desde fuera del worker)
let _client = null;

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

/** Sends a message via the active WA client */
async function sendMessage(to, body) {
    if (!_client || _state.status !== 'ready') {
        console.error('[WA-Gateway] ❌ No se puede enviar el mensaje. Cliente no está listo o no ha sido inicializado.');
        return false;
    }
    try {
        // Aseguramos que el número tenga el sufijo de WhatsApp si es un chat individual
        const chatId = to.includes('@c.us') || to.includes('@g.us') ? to : `${to}@c.us`;
        await _client.sendMessage(chatId, body);
        console.log(`[WA-Gateway] ✉️ Mensaje enviado a ${chatId}`);
        return true;
    } catch (error) {
        console.error('[WA-Gateway] ❌ Error enviando mensaje:', error.message);
        return false;
    }
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

    // Inicializamos a la variable global _client
    _client = new Client({
        authStrategy: new LocalAuth({ dataPath: path.join(__dirname, '.wwebjs_auth') }),
        puppeteer: puppeteerOptions
    });

    _client.on('qr', (qr) => {
        console.log('[WA-Gateway] QR received');
        _state = { status: 'qr', qr, timestamp: Date.now() };
        _persistStatus();
    });

    _client.on('ready', () => {
        console.log('[WA-Gateway] ✅ WhatsApp client ready!');
        _state = { status: 'ready', qr: null, timestamp: Date.now() };
        _persistStatus();
    });

    _client.on('authenticated', () => {
        console.log('[WA-Gateway] Authenticated!');
    });

    _client.on('authenticated', () => {
        console.log('[WA-Gateway] Authenticated!');
    });

    // ==========================================
    // NUEVO: Escuchar mensajes reales de WhatsApp
    // ==========================================
    _client.on('message', async (msg) => {
        // Ignorar estados de WhatsApp
        if (msg.from === 'status@broadcast') return;

        // Cero tolerancia a grupos: Si termina en @g.us, es grupo. Lo ignoramos.
        if (msg.from.endsWith('@g.us')) {
            console.log(`[WA-Gateway] 🚫 Mensaje de grupo ignorado de: ${msg.from}`);
            return;
        }

        console.log(`[WA-Gateway] 📩 Mensaje entrante de ${msg.from}: ${msg.body || '[Multimedia/Vacio]'}`);

        // YA NO DESCARGAMOS LA IMAGEN AQUÍ PARA AHORRAR ESPACIO EN MODO SAAS
        // Solo avisamos al webhook que llegó un archivo adjunto
        const tieneImagen = msg.hasMedia;

        try {
            // Reenviamos el mensaje a nuestro webhook local
            await axios.post('http://localhost:3000/api/v1/whatsapp/webhook', {
                data: {
                    body: msg.body,
                    from: msg.from,
                    fromMe: msg.fromMe,
                    contactId: msg.from,
                    hasMedia: tieneImagen // Solo pasamos un booleano (true/false)
                }
            });
        } catch (error) {
            console.error('[WA-Gateway] ❌ Error mandando el mensaje al Webhook:', error.message);
        }
    });

    _client.on('disconnected', (reason) => {
        console.warn('[WA-Gateway] Disconnected:', reason);
        _state = { status: 'disconnected', qr: null, timestamp: Date.now() };
        _persistStatus();
        // Auto-reconnect after 5s
        setTimeout(_startClient, 5000);
    });

    try {
        await _client.initialize();
    } catch (e) {
        console.error('[WA-Gateway] Failed to initialize:', e.message);
        _state = { status: 'error', qr: null, timestamp: Date.now() };
        _persistStatus();
        setTimeout(_startClient, 10000);
    }
}

// Load from disk on startup so the API always has last-known state
_loadStatus();

// Arrancar el cliente directamente para pruebas locales en VS Code
setTimeout(() => {
    console.log('[WA-Gateway] Inicializando WA junto con el API local...');
    _startClient();
}, 2000);

// Exportamos sendMessage para que el controlador lo pueda usar
module.exports = { getStatus, restart, sendMessage };