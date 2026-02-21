const axios = require('axios');
const { getInitialExtraction } = require('../../../services/aiExtractorService');
const { AISession } = require('../../../models');
const fs = require('fs');
const path = require('path');
const gateway = require('../../../whatsapp-gateway');
const asyncHandler = require('../../core/asyncHandler');

const TRIGGER_COMMAND = 'generar folio';

exports.handleWebhook = asyncHandler(async (req, res) => {
    const messageData = req.body.data || req.body;
    const bodyText = messageData.body || (messageData.message && messageData.message.body);

    if (!bodyText || !bodyText.trim().toLowerCase().includes(TRIGGER_COMMAND)) {
        return res.status(200).send('EVENT_RECEIVED_BUT_IGNORED');
    }

    let conversationText = messageData.conversation;

    if (!conversationText) {
        const contactId = messageData.contactId || (messageData.key && messageData.key.remoteJid) || messageData.from;
        if (contactId && process.env.WHATICKET_API_URL && process.env.WHATICKET_API_TOKEN) {
            try {
                const apiUrl = `${process.env.WHATICKET_API_URL}/messages`;
                const response = await axios.get(apiUrl, {
                    params: { contactId, limit: 20 },
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
    }

    if (!conversationText) conversationText = `Empleado: ${bodyText}`;

    const extractedData = await getInitialExtraction(conversationText);
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

    const newSession = await AISession.create({
        whatsappConversation: conversationText,
        extractedData: extractedData,
        imageUrls: imageUrls,
        chatHistory: [],
        status: 'active'
    });

    res.status(200).send('AI_SESSION_CREATED');
});

exports.getQR = asyncHandler(async (req, res) => {
    const data = gateway.getStatus();

    if (req.query.format === 'image') {
        if (!data.qr) return res.status(404).send('QR Not Ready');
        const qrcode = require('qrcode');
        res.setHeader('Content-Type', 'image/png');
        return qrcode.toFileStream(res, data.qr);
    }

    if (data.qr) {
        const qrcode = require('qrcode');
        data.qr = await qrcode.toDataURL(data.qr);
    }

    res.json(data);
});

exports.refreshSession = asyncHandler(async (req, res) => {
    await gateway.restart();
    res.json({ message: 'Reiniciando sesión de WhatsApp...' });
});
