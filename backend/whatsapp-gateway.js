const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const axios = require('axios');

// --- CONFIGURACIÓN ---
const WEBHOOK_URL = process.env.WEBHOOK_URL || 'https://pasteleria-la-fiesta.up.railway.app/api/webhooks/whatsapp';
const TRIGGER_COMMAND = 'generar folio'; // Comando simplificado

let client;
let qrCodeData = null; // 🟢 AQUÍ GUARDAMOS EL QR
let status = 'disconnected'; // disconnected | ready

const initializeWhatsApp = () => {
    console.log('🚀 Iniciando Mini-Gateway de WhatsApp (Modo Pro)...');

    client = new Client({
        authStrategy: new LocalAuth({
            clientId: "bot-pasteleria-v1"
        }),
        puppeteer: {
            headless: true,
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || null, // Usa el Chromium de Docker
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage', // Vital para evitar crashes de memoria en Docker
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--disable-gpu'
            ]
        }
    });

    // 🟢 EVENTO QR: Guardar en variable
    client.on('qr', (qr) => {
        console.log('📸 Nuevo QR Generado (Listo para Frontend)');
        qrCodeData = qr; // Guardar
        status = 'disconnected';
        // qrcode.generate(qr, { small: true }); // Opcional: mostrar en terminal también
    });

    client.on('ready', () => {
        console.log('✅ WhatsApp Conectado y Listo!');
        status = 'ready';
        qrCodeData = null; // Limpiar QR porque ya no se necesita
        console.log(`📡 Escuchando mensajes (Tuyos y del Cliente) para enviar a: ${WEBHOOK_URL}`);
    });

    client.on('auth_failure', msg => {
        console.error('❌ Error de autenticación:', msg);
        status = 'error';
    });

    client.on('disconnected', (reason) => {
        console.log('❌ WhatsApp desconectado:', reason);
        status = 'disconnected';
        // Evitar bucle de reinicio inmediato
        setTimeout(() => {
            console.log('🔄 Reintentando conexión WhatsApp...');
            client.initialize().catch(err => console.error('Error re-init:', err.message));
        }, 5000);
    });

    // Usamos 'message_create' para detectar mensajes tanto del CLIENTE como del EMPLEADO (tú)
    client.on('message_create', async (msg) => {
        // Procesamos mensajes de texto e IMÁGENES
        if (msg.type !== 'chat' && msg.type !== 'image') return;

        // Detectar si es el comando de activación (puede venir del cliente O del empleado)
        const isTrigger = msg.body.toLowerCase().includes(TRIGGER_COMMAND);

        // Si NO es el comando, lo ignoramos para no saturar el servidor
        if (!isTrigger) {
            return;
        }

        console.log(`🔔 Comando '${TRIGGER_COMMAND}' detectado en chat con ${msg.from}`);
        console.log(`   Enviado por: ${msg.fromMe ? 'Mí (Empleado)' : 'Cliente'}`);

        try {
            // 1. Obtenemos el chat para sacar el historial
            const chat = await msg.getChat();

            // 2. Simulamos que estamos "escribiendo" para dar feedback visual (opcional)
            // await chat.sendStateTyping(); 

            // 3. Recuperamos los últimos 20 mensajes para dar contexto a la IA
            console.log('📜 Recuperando historial de conversación...');
            const messages = await chat.fetchMessages({ limit: 20 });

            const history = messages.map(m => {
                const sender = m.fromMe ? 'Empleado' : 'Cliente';
                // Limpiamos un poco el texto (saltos de línea)
                const cleanBody = m.body.replace(/\n/g, ' ');
                return `${sender}: ${cleanBody}`;
            }).join('\n');

            console.log(`   -> ${history.length} caracteres de historial obtenidos.`);

            // 4. Si es imagen, descargamos el medio
            let mediaData = null;
            if (msg.hasMedia) {
                try {
                    const media = await msg.downloadMedia();
                    if (media) {
                        mediaData = {
                            mimetype: media.mimetype,
                            data: media.data, // Base64
                            filename: media.filename || `image-${Date.now()}.jpg`
                        };
                        console.log('📸 Imagen descargada correctamente.');
                    }
                } catch (mediaError) {
                    console.error('❌ Error descargando imagen:', mediaError.message);
                }
            }

            // 5. Preparamos el payload con el historial COMPLETO y la imagen (si hay)
            const payload = {
                data: {
                    body: msg.body || (mediaData ? '[Imagen adjunta]' : ''),
                    from: msg.from,
                    conversation: history,
                    contactId: msg.from,
                    key: { remoteJid: msg.from },
                    media: mediaData // <--- Enviamos la imagen en Base64
                }
            };

            console.log('📤 Enviando datos completos a Fly.io...');
            await axios.post(WEBHOOK_URL, payload);
            console.log('✅ Enviado con éxito. La IA debería responder pronto.');

        } catch (error) {
            console.error('❌ Error al reenviar webhook:', error.message);
            if (error.response) {
                console.error('   Respuesta del servidor:', error.response.status, error.response.data);
            }
        }
    });

    client.initialize().catch(err => {
        console.error('❌ Error fatal al iniciar WhatsApp:', err.message);
        status = 'error';
    });
};

// 🟢 EXPORTAR FUNCIONES PARA EL CONTROLADOR
module.exports = {
    initializeWhatsApp,
    getClient: () => client,
    getStatus: () => ({ status, qr: qrCodeData }),
    restart: async () => {
        console.log('🔄 Restarting WhatsApp Client via API...');
        if (client) {
            try {
                await client.destroy();
            } catch (e) { console.error('Error destroying client:', e.message); }
        }
        status = 'disconnected';
        qrCodeData = null;
        initializeWhatsApp();
        return { success: true };
    }
};

// 🟢 AUTO-ARRANQUE SI SE EJECUTA DESDE DOCKER/COMANDE (node whatsapp-gateway.js)
if (require.main === module) {
    initializeWhatsApp();

    // Iniciar mini-servidor para que el backend pueda consultar el QR desde otro contenedor
    const express = require('express');
    const app = express();
    const port = 3001;

    app.get('/status', (req, res) => {
        res.json({ status, qr: qrCodeData });
    });

    app.post('/restart', async (req, res) => {
        await module.exports.restart();
        res.json({ success: true });
    });

    app.listen(port, '0.0.0.0', () => {
        console.log(`🌐 Gateway HTTP Server listening on port ${port}`);
    });
}
