const axios = require('axios');
const { getInitialExtraction } = require('../services/aiExtractorService');
const { AISession } = require('../models'); // Asegúrate de importar el modelo
const fs = require('fs');
const path = require('path');
const gateway = require('../whatsapp-gateway'); // Importar gateway completo

// El comando que el empleado usará en WhatsApp para activar la IA
const TRIGGER_COMMAND = 'generar folio';

/**
 * Maneja los webhooks de WhatsApp. Si detecta el comando de activación,
 * extrae los datos de la conversación con IA y crea una SESIÓN DE CHAT.
 */
exports.handleWebhook = async (req, res) => {
  try {
    const messageData = req.body.data || req.body; // Adaptable a diferentes estructuras de webhook

    console.log("📩 Webhook de WhatsApp recibido. Payload:", JSON.stringify(messageData, null, 2));

    // Validar que exista el cuerpo del mensaje
    const bodyText = messageData.body || (messageData.message && messageData.message.body);
    console.log("📝 Texto detectado en el mensaje:", bodyText);

    if (!bodyText || !bodyText.trim().toLowerCase().includes(TRIGGER_COMMAND)) {
      console.log(`⚠️ Comando de activación no encontrado. Esperado: '${TRIGGER_COMMAND}', Recibido: '${bodyText}'`);
      return res.status(200).send('EVENT_RECEIVED_BUT_IGNORED');
    }

    console.log(`✅ Comando '${TRIGGER_COMMAND}' detectado. Iniciando nueva sesión de IA...`);

    let conversationText = messageData.conversation;

    // --- NUEVO: Si no viene la conversación, la buscamos en la API de Whaticket ---
    if (!conversationText) {
      console.log("⚠️ El webhook no incluye historial. Buscando en API de Whaticket...");

      const contactId = messageData.contactId || (messageData.key && messageData.key.remoteJid) || messageData.from;

      if (contactId && process.env.WHATICKET_API_URL && process.env.WHATICKET_API_TOKEN) {
        try {
          // Ejemplo de llamada a API Whaticket (ajustar endpoint según documentación real)
          // GET /messages?contactId=...&limit=20
          const apiUrl = `${process.env.WHATICKET_API_URL}/messages`;
          const response = await axios.get(apiUrl, {
            params: {
              contactId: contactId,
              limit: 20
            },
            headers: { 'Authorization': `Bearer ${process.env.WHATICKET_API_TOKEN}` }
          });

          const messages = response.data.messages || response.data; // Ajustar según respuesta real
          if (Array.isArray(messages)) {
            conversationText = messages.reverse().map(m => {
              const sender = m.fromMe ? "Empleado" : "Cliente";
              return `${sender}: ${m.body}`;
            }).join('\n');
            console.log("✅ Historial recuperado de Whaticket API.");
          }
        } catch (apiError) {
          console.error("❌ Error al consultar API de Whaticket:", apiError.message);
          // Continuamos, tal vez la IA pueda hacer algo solo con el último mensaje (aunque improbable)
        }
      } else {
        console.warn("⚠️ No se puede buscar historial: Faltan credenciales de API o ID de contacto.");
      }
    }

    // Si aún no hay conversación, usamos al menos el mensaje actual para que no falle
    if (!conversationText) {
      conversationText = `Empleado: ${bodyText}`;
    }

    // 2. Enviamos la conversación a nuestro servicio de IA para que la analice.
    const extractedData = await getInitialExtraction(conversationText);
    console.log("🤖 Datos extraídos por la IA:", JSON.stringify(extractedData, null, 2));

    // 3. Procesar imagen si viene en el payload
    const imageUrls = [];
    if (messageData.media) {
      try {
        const media = messageData.media;
        const buffer = Buffer.from(media.data, 'base64');
        const fileName = `whatsapp-${Date.now()}.${media.mimetype.split('/')[1]}`;
        // CORRECCIÓN: Guardar en 'uploads' en la raíz, que es lo que sirve server.js
        const uploadDir = path.join(__dirname, '../../uploads');

        // Asegurar que existe el directorio
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }

        const filePath = path.join(uploadDir, fileName);
        await fs.promises.writeFile(filePath, buffer);

        imageUrls.push(`uploads/${fileName}`);
        console.log(`📸 Imagen guardada en: ${filePath}`);
      } catch (imgError) {
        console.error("❌ Error guardando imagen:", imgError.message);
      }
    }

    // 4. Creamos la nueva sesión de chat en la base de datos.
    const newSession = await AISession.create({
      whatsappConversation: conversationText,
      extractedData: extractedData, // Guardamos el JSON completo extraído por la IA
      imageUrls: imageUrls,
      chatHistory: [], // El historial de chat con el empleado empieza vacío
      status: 'active'
    });

    console.log(`✅ Nueva sesión de IA #${newSession.id} creada exitosamente.`);

    res.status(200).send('AI_SESSION_CREATED');

  } catch (error) {
    console.error("❌ Error procesando el webhook para crear sesión de IA:", error.message);
    res.status(500).send('ERROR_PROCESSING_WEBHOOK');
  }
};

/**
 * Endpoint para obtener el código QR de WhatsApp
 * Convierte el raw string a DataURL para que el frontend no necesite librerías.
 */
exports.getQR = async (req, res) => {
  try {
    let data;
    try {
      // Intentamos consultar al contenedor 'whatsapp' (puerto 3001)
      const response = await axios.get('http://whatsapp:3001/status');
      data = response.data;
    } catch (e) {
      console.warn('⚠️ Gateway container not reachable, fallback to local (likely 404)');
      data = gateway.getStatus();
    }

    // Support for Direct Image Source: /api/whatsapp/qr?format=image
    if (req.query.format === 'image') {
      if (!data.qr) {
        return res.status(404).send('QR Not Ready');
      }
      try {
        const qrcode = require('qrcode');
        res.setHeader('Content-Type', 'image/png');
        return qrcode.toFileStream(res, data.qr);
      } catch (qrErr) {
        console.error("QR Image Gen Error:", qrErr);
        return res.status(500).send('Error generating QR image');
      }
    }

    // Default JSON behavior
    if (data.qr) {
      try {
        const qrcode = require('qrcode');
        data.qr = await qrcode.toDataURL(data.qr);
      } catch (qrErr) {
        console.error("QR DataURL Error:", qrErr);
        data.qr = null;
      }
    }

    res.json(data);
  } catch (error) {
    console.error("❌ Error obteniendo QR:", error.message);
    res.status(500).json({
      status: 'error',
      qr: null,
      message: error.message
    });
  }
};

exports.refreshSession = async (req, res) => {
  try {
    try {
      await axios.post('http://whatsapp:3001/restart');
    } catch (e) {
      console.warn('⚠️ Gateway container not reachable, using local fallback');
      await gateway.restart();
    }
    res.json({ message: 'Reiniciando sesión de WhatsApp...' });
  } catch (error) {
    res.status(500).json({ message: 'Error reiniciando sesión' });
  }
};
