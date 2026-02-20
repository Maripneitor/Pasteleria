const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// --- CONFIGURACIÓN ---
const WEBHOOK_URL = process.env.WEBHOOK_URL;
if (!WEBHOOK_URL) {
    console.error("🔥 CRITICAL ERROR: La variable de entorno WEBHOOK_URL no está definida.");
    console.error("👉 Configura WEBHOOK_URL en tu archivo .env o panel de hosting para que WhatsApp sepa a dónde mandar los mensajes.");
    // No lanzamos excepcion para no crashear la API principal si corre en modo monolítico sin intentarlo, 
    // pero marcamos bandera
}
const TRIGGER_COMMAND = 'generar folio'; // Comando simplificado

let client;
const cacheFile = path.join(__dirname, 'whatsapp_status.json');

// Helpers for QR state
const setGlobalState = async (statusArg, qrArg = null) => {
    try {
        await fs.promises.writeFile(cacheFile, JSON.stringify({ status: statusArg, qr: qrArg, timestamp: Date.now() }));
    } catch (e) {
        console.error("Error saving whatsapp state", e.message);
    }
};

const getGlobalState = () => {
    try {
        if (fs.existsSync(cacheFile)) {
            const data = fs.readFileSync(cacheFile, 'utf8');
            return JSON.parse(data);
        }
    } catch (e) { }
    return { status: 'disconnected', qr: null };
};

const initializeWhatsApp = () => {
    // 🛡️ MODO CUARENTENA: Solo iniciar si se ejecuta como microservicio aislado o si hay flag explícito.
    // Esto evita que whatsapp-web.js (que lanza otro Puppeteer inestable) tire el servidor de la API Principal.
    if (!process.env.WHATSAPP_MICROSERVICE_MODE && require.main !== module) {
        console.warn('🚧 WhatsApp Web Gateway está en CUARENTENA (Desactivado). No se iniciará en la API principal.');
        console.warn('👉 Para usarlo, ejecútalo como microservicio: node whatsapp-gateway.js');
        return;
    }

    console.log('🚀 Iniciando Mini-Gateway de WhatsApp (Modo Pro AISLADO)...');

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

    // 🟢 EVENTO QR: Guardar en variable persistencia
    client.on('qr', (qr) => {
        console.log('📸 Nuevo QR Generado (Listo para Frontend)');
        setGlobalState('disconnected', qr);
    });

    client.on('ready', () => {
        console.log('✅ WhatsApp Conectado y Listo!');
        setGlobalState('ready', null);
        console.log(`📡 Escuchando mensajes (Tuyos y del Cliente) para enviar a: ${WEBHOOK_URL}`);
    });

    client.on('auth_failure', msg => {
        console.error('❌ Error de autenticación:', msg);
        setGlobalState('error', null);
    });

    client.on('disconnected', (reason) => {
        console.log('❌ WhatsApp desconectado:', reason);
        setGlobalState('disconnected', null);
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

            if (!WEBHOOK_URL) {
                console.error('❌ No se envio al webhook porque WEBHOOK_URL no esta definda');
                return;
            }
            console.log('📤 Enviando datos completos a:', WEBHOOK_URL);
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
        setGlobalState('error', null);
    });
};

// 🟢 EXPORTAR FUNCIONES PARA EL CONTROLADOR
module.exports = {
    initializeWhatsApp,
    getClient: () => client,
    getStatus: () => getGlobalState(),
    restart: async () => {
        console.log('🔄 Restarting WhatsApp Client via API...');
        if (client) {
            try {
                await client.destroy();
            } catch (e) { console.error('Error destroying client:', e.message); }
        }
        await setGlobalState('disconnected', null);
        initializeWhatsApp();
        return { success: true };
    }
};

// 🟢 AUTO-ARRANQUE SI SE EJECUTA DESDE DOCKER/COMANDE (node whatsapp-gateway.js)
if (require.main === module) {
    initializeWhatsApp();
}