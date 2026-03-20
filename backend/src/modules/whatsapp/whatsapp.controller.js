const axios = require('axios');
const gateway = require('../../../whatsapp-gateway');
const asyncHandler = require('../../core/asyncHandler');
const { AISession, Folio } = require('../../../models'); 
const aiOrderParsingService = require('../../../services/aiOrderParsingService'); 
const { getInitialExtraction } = require('../../../services/aiExtractorService'); 

exports.handleWebhook = asyncHandler(async (req, res) => {
    res.status(200).send('EVENT_RECEIVED');

    console.log("📸 === WEBHOOK ENTRANTE ===", JSON.stringify(req.body, null, 2));

    const messageData = req.body.data || req.body;
    let bodyText = messageData.body || (messageData.message && messageData.message.body) || '';

    if (messageData.fromMe) return;

    const contactId = messageData.contactId || (messageData.key && messageData.key.remoteJid) || messageData.from;
    if (!contactId) return;

    if (contactId.includes('@g.us')) {
        return; 
    }

    // ========================================================
    // 📸 DETECCIÓN DE IMAGEN (MODO SaaS: Sin guardar en disco)
    // ========================================================
    const tieneImagen = !!messageData.media || !!messageData.hasMedia;
    
    // Si mandó solo imagen sin texto, le ponemos un placeholder para que la IA sepa qué pasó
    if (tieneImagen && !bodyText) {
        bodyText = "*(El cliente adjuntó una imagen)*";
    }

    if (!bodyText) return;

    try {
        const textoLimpio = bodyText.trim().toLowerCase();
        
        // --- 🚦 MANEJO DE COMANDOS DE FLUJO ---
        if (textoLimpio === 'cancelar') {
            const sesionExistente = await AISession.findOne({ where: { customerPhone: contactId, status: 'active' } });
            if (sesionExistente) {
                sesionExistente.status = 'completed';
                await sesionExistente.save();
                await gateway.sendMessage(contactId, "🚫 *Proceso cancelado.*\nEscribe 'Hola' cuando gustes iniciar de nuevo.");
                return; 
            }
        } 
        else if (textoLimpio === 'reiniciar' || textoLimpio === 'menu' || textoLimpio === 'menú') {
            const sesionExistente = await AISession.findOne({ where: { customerPhone: contactId, status: 'active' } });
            if (sesionExistente) {
                sesionExistente.status = 'completed';
                await sesionExistente.save();
            }
            // No hacemos return; dejamos que fluya para que la IA mande el Menú oficial
        }

        // --- ⏱️ AUTO-REINICIO POR INACTIVIDAD (5 MINUTOS) ---
        let session = await AISession.findOne({
            where: { customerPhone: contactId, status: 'active' }
        });

        if (session) {
            const tiempoInactivoMs = new Date() - new Date(session.updatedAt);
            if (tiempoInactivoMs / (1000 * 60) >= 5) { 
                session.status = 'completed';
                await session.save();
                session = null; 
            }
        }

        // ========================================================
        // 🚪 EL PORTERO: FILTRO DE INICIO (TRIGGERS)
        // ========================================================
        const triggersInicio = [
            'hola', 'buenos dias', 'buenos días', 'buenas tardes', 'buenas noches', 
            'pedido', 'hacer pedido', 'detalles', 'ver detalles', 'informacion', 
            'información', 'menu', 'menú', 'reiniciar'
        ];

        // Verificamos si el mensaje es una "llave" para abrir la plática
        const esTrigger = triggersInicio.some(t => textoLimpio.includes(t));

        let conversationText = messageData.conversation;

        if (!session) {
            // SI NO HAY SESIÓN Y NO ES UN SALUDO/PEDIDO: Ignoramos (Silencio total)
            if (!esTrigger) {
                console.log(`[WA-Controller] 🤐 Mensaje de ${contactId} ignorado (No es trigger): "${bodyText}"`);
                return; 
            }

            // SI ES TRIGGER: Intentamos recuperar contexto de Whaticket
            console.log(`[WA-Controller] 🚀 Trigger detectado. Iniciando nueva sesión para ${contactId}`);
            
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

            // CREACIÓN DE LA SESIÓN (Limpia, sin imageUrls para modo SaaS)
            session = await AISession.create({
                customerPhone: contactId, 
                whatsappConversation: conversationText,
                chatHistory: [{ role: 'user', content: bodyText }],
                status: 'active'
            });
        }
        
        else {
            session.whatsappConversation += `\nCliente: ${bodyText}`;
            
            // NUEVO: Avisarle a la IA que el cliente mandó un archivo multimedia
            if (messageData.hasMedia) {
                const avisoImagen = { 
                    role: 'system', 
                    content: `(SISTEMA: El cliente acaba de adjuntar una imagen. Agradécele y dile que el pastelero la revisará).` 
                };
                session.chatHistory = [...session.chatHistory, { role: 'user', content: bodyText || "(Imagen adjunta)" }, avisoImagen];
            } else {
                session.chatHistory = [...session.chatHistory, { role: 'user', content: bodyText }];
            }
            
            await session.save();
        }

        const tenantId = 1; 
        let aiReplyText = await aiOrderParsingService.generateWhatsAppReply(session.chatHistory, tenantId);

        // ====================================================================
        // INTERCEPCIÓN A: CREAR UN NUEVO PEDIDO LEYENDO EL JSON DE LA IA
        // ====================================================================
        if (aiReplyText.includes('[CREAR_FOLIO_AHORA]')) {
            // Extraemos todo lo que está después de la etiqueta (el JSON)
            const partes = aiReplyText.split('[CREAR_FOLIO_AHORA]');
            const textoDespedida = partes[0]; // Por si la IA puso texto antes
            const posibleJson = partes[1].trim();
            
            let orderData = {};
            try {
                // Limpiamos los backticks (```json) que a veces pone la IA
                const cleanJson = posibleJson.replace(/```json/g, '').replace(/```/g, '').trim();
                orderData = JSON.parse(cleanJson);
            } catch (jsonError) {
                console.error("❌ Error parseando JSON de la IA:", jsonError);
                // Fallback de seguridad usando tu extractor anterior si el JSON falla
                orderData = await getInitialExtraction(session.whatsappConversation); 
            }

            try {
                const nuevoFolio = await Folio.create({
                    cliente_nombre: orderData.cliente_nombre || orderData.nombre || 'Cliente WhatsApp',
                    cliente_telefono: contactId.replace('@c.us', ''),
                    fecha_entrega: orderData.fecha_entrega || null,
                    hora_entrega: orderData.hora_entrega || null,
                    is_delivery: !!orderData.ubicacion_entrega || !!orderData.calle,
                    calle: orderData.calle || null,
                    colonia: orderData.colonia || null,
                    ubicacion_entrega: orderData.ubicacion_entrega || orderData.calle || 'Sucursal',
                    
                    // 🔥 NUEVOS CAMPOS DEL FLUJO AVANZADO
                    numero_personas: orderData.numero_personas || 10,
                    forma: orderData.forma || null,
                    tipo_folio: orderData.tipo_folio || 'Normal',
                    detallesPisos: orderData.detallesPisos || null,
                    complementarios: orderData.complementarios || null,
                    
                    sabores_pan: Array.isArray(orderData.sabores_pan) ? orderData.sabores_pan : (orderData.sabor_pan ? [orderData.sabor_pan] : []), 
                    rellenos: Array.isArray(orderData.rellenos) ? orderData.rellenos : (orderData.relleno ? [orderData.relleno] : []),       
                    descripcion_diseno: orderData.descripcion_diseno || orderData.diseno || null,
                    dedicatoria: orderData.dedicatoria || null,
                    
                    origen: 'WhatsApp Bot',
                    status: 'DRAFT',
                    estatus_produccion: 'Pendiente',
                    estatus_pago: 'Pendiente',
                    tenantId: tenantId 
                });

                aiReplyText = textoDespedida + `\n\n✅ ¡Excelente! Tu pedido ha sido registrado con éxito. Tu número de folio oficial es el *#${nuevoFolio.id}*. \n\n⚠️ *Nota:* Si necesitas cambiar algo, comunícate al local lo antes posible.\n\n¡Te esperamos en Pastelería La Fiesta!\n\n_(🤖 El asistente se ha pausado. Escribe "Hola" o "Menú" para iniciar otra plática)_`;
                
                session.status = 'completed';
                
            } catch (dbError) {
                console.error("❌ Error al guardar el Folio en MySQL:", dbError);
                aiReplyText = `⚠️ Hemos confirmado tu pedido, pero ocurrió un pequeño retraso al generar el número de folio en nuestro sistema. Lo revisaremos enseguida.`;
            }
        }

        // ====================================================================
        // INTERCEPCIÓN B: VER DETALLES DE UN PEDIDO EXISTENTE
        // ====================================================================
        const buscarFolioRegex = /\[BUSCAR_FOLIO:\s*#?(\d+)\]/i; 
        const folioMatch = aiReplyText.match(buscarFolioRegex);
        
        if (folioMatch) {
            const folioBuscado = folioMatch[1]; 
            aiReplyText = aiReplyText.replace(buscarFolioRegex, '').trim(); 

            try {
                const f = await Folio.findByPk(folioBuscado);
                
                if (f) {
                    const panTxt = f.sabores_pan && f.sabores_pan.length > 0 ? f.sabores_pan.join(', ') : "No especificado";
                    const rellenoTxt = f.rellenos && f.rellenos.length > 0 ? f.rellenos.join(', ') : "No especificado";
                    const disenoTxt = f.descripcion_diseno || "Ninguno / Estándar";
                    const dedicatoriaTxt = f.dedicatoria || "Sin dedicatoria";
                    const entregaTxt = f.ubicacion_entrega || "Recoger en Sucursal";
                    const pisosTxt = f.detallesPisos ? `${f.detallesPisos.length} pisos` : f.tipo_folio;
                    const extrasTxt = f.complementarios ? `${f.complementarios.length} pasteles extra` : 'Ninguno';
                    
                    let precioTxt = "Por definir (El local te confirmará el total pronto)";
                    if (f.total && parseFloat(f.total) > 0) {
                        precioTxt = `$${parseFloat(f.total).toFixed(2)}`;
                    }

                    aiReplyText += `\n\n📦 *DETALLES DE TU PEDIDO #${folioBuscado}*\n` +
                                   `👤 *Nombre:* ${f.cliente_nombre}\n` +
                                   `📅 *Fecha de entrega:* ${f.fecha_entrega || 'Pendiente'}\n` +
                                   `🍰 *Tamaño principal:* Para ${f.numero_personas || '??'} personas\n` +
                                   `💠 *Forma:* ${f.forma || 'N/A'}\n` +
                                   `🏢 *Estructura:* ${pisosTxt}\n` +
                                   `➕ *Complementarios:* ${extrasTxt}\n` +
                                   `🍞 *Pan principal:* ${panTxt}\n` +
                                   `🍓 *Relleno principal:* ${rellenoTxt}\n` +
                                   `🎨 *Diseño:* ${disenoTxt}\n` +
                                   `✍️ *Dedicatoria:* ${dedicatoriaTxt}\n` +
                                   `📍 *Entrega:* ${entregaTxt}\n` +
                                   `--------------------------\n` +
                                   `💵 *Precio Total:* ${precioTxt}\n` +
                                   `💰 *Estado de Pago:* ${f.estatus_pago}\n` +
                                   `\n_(🤖 El asistente se ha pausado. Escribe "Hola" para iniciar otra plática)_`;
                } else {
                    aiReplyText += `\n\n⚠️ Lo siento, no encontré ningún pedido con el folio *#${folioBuscado}*. Revisa el número e intenta de nuevo.`;
                }
                
                session.status = 'completed';
                
            } catch (err) {
                console.error("❌ Error al buscar folio:", err);
                aiReplyText += `\n\n⚠️ Tuvimos un problema técnico. Intenta de nuevo en unos minutos.`;
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