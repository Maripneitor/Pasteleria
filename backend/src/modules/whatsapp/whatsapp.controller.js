const axios = require('axios');
const fs = require('fs');
const path = require('path');
const gateway = require('../../../whatsapp-gateway');
const asyncHandler = require('../../core/asyncHandler');
const { AISession, Folio } = require('../../../models'); 
const aiOrderParsingService = require('../../../services/aiOrderParsingService'); 
const { getInitialExtraction } = require('../../../services/aiExtractorService'); 

exports.handleWebhook = asyncHandler(async (req, res) => {
    res.status(200).send('EVENT_RECEIVED');

    const messageData = req.body.data || req.body;
    const bodyText = messageData.body || (messageData.message && messageData.message.body);

    if (!bodyText || messageData.fromMe) return;

    const contactId = messageData.contactId || (messageData.key && messageData.key.remoteJid) || messageData.from;
    if (!contactId) return;

    if (contactId.includes('@g.us')) {
        return; 
    }

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
        const textoLimpio = bodyText.trim().toLowerCase();
        
        if (textoLimpio === 'cancelar') {
            const sesionExistente = await AISession.findOne({ where: { customerPhone: contactId, status: 'active' } });
            
            if (sesionExistente) {
                sesionExistente.status = 'completed';
                await sesionExistente.save();
                
                await gateway.sendMessage(contactId, "🚫 *Proceso cancelado.*\nNo te preocupes, no se generó ningún pedido en nuestro sistema.\n\nSi cambias de opinión, escribe 'Hola' para ver el menú principal de nuevo.");
                return; 
            }
        } 
        else if (textoLimpio === 'reiniciar' || textoLimpio === 'menu' || textoLimpio === 'menú') {
            const sesionExistente = await AISession.findOne({ where: { customerPhone: contactId, status: 'active' } });
            if (sesionExistente) {
                sesionExistente.status = 'completed';
                await sesionExistente.save();
            }
            await gateway.sendMessage(contactId, "🔄 *Menú principal:*\n¡Hola! 😊 ¿En qué puedo ayudarte hoy?\n\n1️⃣ Hacer un nuevo pedido de pastel.\n2️⃣ Consultar el estado de un pedido existente.\n3️⃣ Información del local.");
            return; 
        }

        // --- NUEVO: AUTO-REINICIO POR INACTIVIDAD (5 MINUTOS) ---
        let session = await AISession.findOne({
            where: { customerPhone: contactId, status: 'active' }
        });

        if (session) {
            const tiempoInactivoMs = new Date() - new Date(session.updatedAt);
            const minutosInactivo = tiempoInactivoMs / (1000 * 60);

            if (minutosInactivo >= 5) { // <--- AQUÍ CAMBIAMOS A 5
                console.log(`⏱️ Sesión inactiva por ${Math.floor(minutosInactivo)} min. Cerrando sesión de ${contactId}`);
                session.status = 'completed';
                await session.save();
                session = null; // Forzamos a que cree una nueva abajo
            }
        }
        // ---------------------------------------------------------

        let conversationText = messageData.conversation;

        if (!session) {
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
                    console.error("❌ Error API Whaticket:", apiError.message);
                }
            }

            if (!conversationText) conversationText = `Cliente: ${bodyText}`;
            else conversationText += `\nCliente: ${bodyText}`;

            session = await AISession.create({
                customerPhone: contactId, 
                whatsappConversation: conversationText,
                imageUrls: imageUrls,
                chatHistory: [{ role: 'user', content: bodyText }],
                status: 'active'
            });
        } else {
            session.whatsappConversation += `\nCliente: ${bodyText}`;
            const currentHistory = session.chatHistory || [];
            session.chatHistory = [...currentHistory, { role: 'user', content: bodyText }];
            if (imageUrls.length > 0) session.imageUrls = [...(session.imageUrls || []), ...imageUrls];
            await session.save();
        }

        const tenantId = 1; 
        let aiReplyText = await aiOrderParsingService.generateWhatsAppReply(session.chatHistory, tenantId);

        const extractedData = await getInitialExtraction(session.whatsappConversation);
        session.extractedData = extractedData;

        // ====================================================================
        // INTERCEPCIÓN A: CREAR UN NUEVO PEDIDO
        // ====================================================================
        if (aiReplyText.includes('[CREAR_FOLIO_AHORA]')) {
            aiReplyText = aiReplyText.replace('[CREAR_FOLIO_AHORA]', '').trim();

            try {
                const orderData = session.extractedData || {};

                const nuevoFolio = await Folio.create({
                    cliente_nombre: orderData.nombre || 'Cliente WhatsApp',
                    cliente_telefono: contactId.replace('@c.us', ''),
                    fecha_entrega: orderData.fecha_entrega || null,
                    hora_entrega: orderData.hora_entrega || null,
                    is_delivery: orderData.requiere_envio === true,
                    calle: orderData.calle || null,
                    colonia: orderData.colonia || null,
                    referencias: orderData.referencias || null,
                    ubicacion_entrega: orderData.requiere_envio ? `${orderData.calle}, ${orderData.colonia}` : 'Sucursal',
                    numero_personas: orderData.numero_personas || 10,
                    sabores_pan: orderData.sabor_pan ? [orderData.sabor_pan] : [], 
                    rellenos: orderData.relleno ? [orderData.relleno] : [],       
                    descripcion_diseno: orderData.diseno || null,
                    dedicatoria: orderData.dedicatoria || null,
                    origen: 'WhatsApp Bot',
                    status: 'DRAFT',
                    estatus_produccion: 'Pendiente',
                    estatus_pago: 'Pendiente',
                    tenantId: tenantId 
                });

                aiReplyText += `\n\n✅ ¡Excelente! Tu pedido ha sido registrado con éxito. Tu número de folio oficial es el *#${nuevoFolio.id}*. \n\n⚠️ *Nota:* Si te arrepentiste o necesitas cancelar este pedido, por favor comunícate directamente al número de la pastelería lo antes posible.\n\n¡Te esperamos en Pastelería La Fiesta!\n\n_(🤖 El asistente se ha pausado. Si necesitas algo más, solo escríbeme "Hola", "Qué onda" o "Menú" para iniciar otra plática)_`;
                
                session.status = 'completed';
                
            } catch (dbError) {
                console.error("❌ Error al guardar el Folio en MySQL:", dbError);
                aiReplyText += `\n\n⚠️ Hemos confirmado tu pedido, pero ocurrió un pequeño retraso al generar el número de folio en nuestro sistema. Lo revisaremos enseguida.`;
            }
        }

        // ====================================================================
        // INTERCEPCIÓN B: BUSCAR UN PEDIDO EXISTENTE
        // ====================================================================
        const buscarFolioRegex = /\[BUSCAR_FOLIO:\s*(\d+)\]/;
        const folioMatch = aiReplyText.match(buscarFolioRegex);
        
        if (folioMatch) {
            const folioBuscado = folioMatch[1]; 
            aiReplyText = aiReplyText.replace(buscarFolioRegex, '').trim(); 

            try {
                const folioEncontrado = await Folio.findByPk(folioBuscado);
                
                if (folioEncontrado) {
                    let panTxt = folioEncontrado.sabores_pan && folioEncontrado.sabores_pan.length > 0 ? folioEncontrado.sabores_pan.join(', ') : "No especificado";
                    let rellenoTxt = folioEncontrado.rellenos && folioEncontrado.rellenos.length > 0 ? folioEncontrado.rellenos.join(', ') : "No especificado";

                    let precioTxt = "Por definir (El local te confirmará el total pronto)";
                    if (folioEncontrado.total && parseFloat(folioEncontrado.total) > 0) {
                        precioTxt = `$${parseFloat(folioEncontrado.total).toFixed(2)}`;
                    }

                    aiReplyText += `\n\n📦 *Detalles de tu Folio #${folioBuscado}*\n` +
                                   `👤 *A nombre de:* ${folioEncontrado.cliente_nombre}\n` +
                                   `🎂 *Pastel:* Pan de ${panTxt} con relleno de ${rellenoTxt}\n` +
                                   `📅 *Entrega:* ${folioEncontrado.fecha_entrega || 'Pendiente'}\n` +
                                   `💵 *Precio Total:* ${precioTxt}\n` +
                                   `💰 *Estado de Pago:* ${folioEncontrado.estatus_pago}\n` +
                                   `\n_(🤖 El asistente se ha pausado. Si necesitas consultar otro folio o hacer un pedido nuevo, solo escríbeme "Hola" o "Qué onda" para iniciar otra plática)_`;
                } else {
                    aiReplyText += `\n\n⚠️ Lo siento, no encontré ningún pedido registrado con el folio *#${folioBuscado}*. Por favor asegúrate de que el número sea correcto e intenta de nuevo.`;
                }
                
                // --- NUEVO: Cerramos la sesión también al terminar de consultar ---
                session.status = 'completed';
                
            } catch (err) {
                console.error("❌ Error al buscar folio en la BD:", err);
                aiReplyText += `\n\n⚠️ Tuvimos un problema técnico al buscar tu pedido. Por favor intenta de nuevo en unos minutos.`;
            }
        }

        session.whatsappConversation += `\nAsistente: ${aiReplyText}`;
        session.chatHistory = [...session.chatHistory, { role: 'assistant', content: aiReplyText }];
        await session.save();

        await gateway.sendMessage(contactId, aiReplyText);

    } catch (error) {
        console.error("❌ Error procesando el webhook de WhatsApp:", error);
    }
});

// --- REEMPLAZA TU FUNCIÓN getQR POR ESTA ---
exports.getQR = asyncHandler(async (req, res) => {
    const data = gateway.getStatus();

    if (!data.qr) {
        return res.status(404).send('<h1>QR no listo</h1><p>Espera unos segundos y recarga la página. Si el bot ya está conectado, no verás un QR.</p>');
    }

    const qrcode = require('qrcode');
    res.setHeader('Content-Type', 'image/png');
    
    return qrcode.toFileStream(res, data.qr);
});

exports.refreshSession = asyncHandler(async (req, res) => {
    await gateway.restart();
    res.json({ message: 'Reiniciando sesión de WhatsApp...' });
});