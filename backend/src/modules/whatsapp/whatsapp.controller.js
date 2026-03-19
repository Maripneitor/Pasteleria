const axios = require('axios');
const fs = require('fs');
const path = require('path');
const gateway = require('../../../whatsapp-gateway');
const asyncHandler = require('../../core/asyncHandler');
const { AISession } = require('../../../models');
const aiOrderParsingService = require('../../../services/aiOrderParsingService'); // Ajusta la ruta a donde esté tu archivo

// IMPORTANTE: Aquí importas el servicio de IA que ya usas en la web para que evalúe la intención
// Ajusta la ruta según dónde tengas tu servicio
// const aiOrderParsingService = require('../ai-orders/aiOrderParsingService'); 
const { getInitialExtraction } = require('../../../services/aiExtractorService'); 

exports.handleWebhook = asyncHandler(async (req, res) => {
    // 1. Responder rápido con 200 OK para evitar que Whaticket/WhatsApp nos marque timeout 
    // mientras la IA piensa la respuesta.
    res.status(200).send('EVENT_RECEIVED');

    const messageData = req.body.data || req.body;
    const bodyText = messageData.body || (messageData.message && messageData.message.body);

    // Ignorar si no hay texto o si el mensaje fue enviado por el propio bot/empleado
    if (!bodyText || messageData.fromMe) return;

    const contactId = messageData.contactId || (messageData.key && messageData.key.remoteJid) || messageData.from;
    if (!contactId) return;

    // 2. Manejo de imágenes (Mantenemos tu lógica intacta)
    const imageUrls = [];
    if (messageData.media) {
        try {
            const media = messageData.media;
            const buffer = Buffer.from(media.data, 'base64');
            const fileName = `whatsapp-${Date.now()}.${media.mimetype.split('/')[1]}`;
            const uploadDir = path.join(__dirname, '../../../uploads');

            if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

            const filePath = path.join(uploadDir, fileName);
            await fs.promises.writeFile(filePath, buffer);
            imageUrls.push(`uploads/${fileName}`);
        } catch (imgError) {
            console.error("❌ Error guardando imagen:", imgError.message);
        }
    }

    try {
        // 3. Buscar una sesión activa para este cliente para mantener el contexto
        // Asegúrate de que tu modelo AISession en BD acepte 'phoneNumber'
        let session = await AISession.findOne({
    where: { customerPhone: contactId, status: 'active' } // <-- Cambia a customerPhone
});

        let conversationText = messageData.conversation;

        if (!session) {
            // Si es sesión nueva y no viene historial en el payload, intentamos traerlo de Whaticket
            if (!conversationText && process.env.WHATICKET_API_URL && process.env.WHATICKET_API_TOKEN) {
                try {
                    const apiUrl = `${process.env.WHATICKET_API_URL}/messages`;
                    const response = await axios.get(apiUrl, {
                        params: { contactId, limit: 10 },
                        headers: { 'Authorization': `Bearer ${process.env.WHATICKET_API_TOKEN}` }
                    });
                    const messages = response.data.messages || response.data;
                    if (Array.isArray(messages)) {
                        conversationText = messages.reverse().map(m => {
                            const sender = m.fromMe ? "Empleado" : "Cliente";
                            return `${sender}: ${m.body}`;
                        }).join('\n');
                    }
                } catch (apiError) {
                    console.error("❌ Error al consultar API de Whaticket:", apiError.message);
                }
            }

            if (!conversationText) conversationText = `Cliente: ${bodyText}`;
            else conversationText += `\nCliente: ${bodyText}`;

            // Crear la sesión nueva
            session = await AISession.create({
                customerPhone: contactId, 
                whatsappConversation: conversationText,
                imageUrls: imageUrls,
                chatHistory: [{ role: 'user', content: bodyText }],
                status: 'active'
            });
        } else {
            // Si ya existe la sesión, agregamos el nuevo mensaje al contexto
            session.whatsappConversation += `\nCliente: ${bodyText}`;
            
            const currentHistory = session.chatHistory || [];
            session.chatHistory = [...currentHistory, { role: 'user', content: bodyText }];
            
            if (imageUrls.length > 0) {
                session.imageUrls = [...(session.imageUrls || []), ...imageUrls];
            }
            await session.save();
        }

        // 4. Procesar con tu IA
        // =========================================================================
        // AQUI ES DONDE LA MAGIA SUCEDE:
        // Deberás pasarle `session.chatHistory` a tu servicio OpenAI para que 
        // valide si faltan sabores, fechas, etc., igual que en la web.
        // Ej: const aiReplyText = await aiOrderParsingService.generateWhatsAppReply(session.chatHistory);
        // =========================================================================

        // CONEXIÓN REAL CON TU IA:
const tenantId = 1; // Asumimos el ID 1 para tu sucursal principal
const aiReplyText = await aiOrderParsingService.generateWhatsAppReply(session.chatHistory, tenantId);

        // Extraer datos iniciales en background (tu lógica original, si la sigues necesitando)
        const extractedData = await getInitialExtraction(session.whatsappConversation);
        session.extractedData = extractedData;

        // 5. Guardar la respuesta de la IA en la sesión
        session.whatsappConversation += `\nAsistente: ${aiReplyText}`;
        session.chatHistory = [...session.chatHistory, { role: 'assistant', content: aiReplyText }];
        await session.save();

        // 6. Enviar la respuesta real por WhatsApp
        await gateway.sendMessage(contactId, aiReplyText);

    } catch (error) {
        console.error("❌ Error procesando el webhook de WhatsApp:", error);
    }
});

// --- REEMPLAZA TU FUNCIÓN getQR POR ESTA ---
exports.getQR = asyncHandler(async (req, res) => {
    const data = gateway.getStatus();

    // 1. Si no hay QR todavía, avisamos
    if (!data.qr) {
        return res.status(404).send('<h1>QR no listo</h1><p>Espera unos segundos y recarga la página. Si el bot ya está conectado, no verás un QR.</p>');
    }

    // 2. Si hay QR, lo convertimos en imagen y lo enviamos directamente
    const qrcode = require('qrcode');
    res.setHeader('Content-Type', 'image/png');
    
    // Esto "dibuja" el QR y lo manda al navegador como una foto PNG
    return qrcode.toFileStream(res, data.qr);
});

exports.refreshSession = asyncHandler(async (req, res) => {
    await gateway.restart();
    res.json({ message: 'Reiniciando sesión de WhatsApp...' });
});