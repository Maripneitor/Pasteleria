const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const axios = require('axios');

// --- CONFIGURACIÓN ---
const WEBHOOK_URL = 'https://pasteleria-la-fiesta.up.railway.app/api/webhooks/whatsapp';
const TRIGGER_COMMAND = 'generar folio'; // Comando simplificado

console.log('🚀 Iniciando Mini-Gateway de WhatsApp (Modo Pro)...');

const client = new Client({
    // 1. ASIGNAMOS UN ID ÚNICO PARA QUE LA CARPETA DE SESIÓN NO SE MEZCLE
    authStrategy: new LocalAuth({ 
        clientId: "bot-pasteleria-v1" 
    }),
    puppeteer: {
        // --- CAMBIO IMPORTANTE ---
        // 'false' hace que se abra la ventana visible de Google Chrome
        // 'true' haría que fuera invisible (como estaba antes)
        headless: false, 
        args: [
            '--no-sandbox', 
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu' // Recomendado para mayor estabilidad en Windows
        ]
    }
});

client.on('qr', (qr) => {
    console.log('📸 Escanea este código QR con tu WhatsApp (Mira la ventana de Chrome):');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('✅ Cliente de WhatsApp conectado y listo!');
    console.log(`📡 Escuchando mensajes (Tuyos y del Cliente) para enviar a: ${WEBHOOK_URL}`);
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

        // Dejamos de "escribir"
        // await chat.clearState();

    } catch (error) {
        console.error('❌ Error al reenviar webhook:', error.message);
        if (error.response) {
            console.error('   Respuesta del servidor:', error.response.status, error.response.data);
        }
    }
});

client.initialize();