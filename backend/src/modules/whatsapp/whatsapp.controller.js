const axios = require('axios');
const gateway = require('../../../whatsapp-gateway');
const asyncHandler = require('../../core/asyncHandler');
const { AISession, Folio } = require('../../../models'); 
const aiOrderParsingService = require('../../../services/aiOrderParsingService'); 
const { getInitialExtraction } = require('../../../services/aiExtractorService'); 

// =====================================================================
// 🔥 BLINDAJE EXTREMO: UTILIDAD SALVAVIDAS PARA ARREGLOS Y OBJETOS
// =====================================================================
const parseArraySafe = (data) => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (typeof data === 'string') {
        try { 
            const parsed = JSON.parse(data); 
            if (Array.isArray(parsed)) return parsed;
            if (typeof parsed === 'object') {
                // FIX: Si el objeto parece ser un solo ítem (conserva sus llaves)
                if (parsed.personas || parsed.panes || parsed.rellenos || parsed.shape || parsed.forma) {
                    return [parsed];
                }
                return Object.values(parsed); // Rescata si GPT mandó un diccionario {"1": {...}}
            }
            return [parsed];
        } catch(e) { 
            return [data]; 
        }
    }
    if (typeof data === 'object') {
        // FIX: Si el objeto es un solo ítem
        if (data.personas || data.panes || data.rellenos || data.shape || data.forma) {
            return [data];
        }
        return Object.values(data);
    }
    return [data];
};

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

    const tieneImagen = !!messageData.media || !!messageData.hasMedia;
    
    if (tieneImagen && !bodyText) {
        bodyText = "*(El cliente adjuntó una imagen)*";
    }

    if (!bodyText) return;

    try {
        const textoLimpio = bodyText.trim().toLowerCase();
        
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
        }

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

        const triggersInicio = [
            'hola', 'buenos dias', 'buenos días', 'buenas tardes', 'buenas noches', 
            'pedido', 'hacer pedido', 'detalles', 'ver detalles', 'informacion', 
            'información', 'menu', 'menú', 'reiniciar'
        ];

        const esTrigger = triggersInicio.some(t => textoLimpio.includes(t));
        let conversationText = messageData.conversation;

        if (!session) {
            if (!esTrigger) {
                return; 
            }
            
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
                } catch (apiError) {}
            }

            if (!conversationText) conversationText = `Cliente: ${bodyText}`;
            else conversationText += `\nCliente: ${bodyText}`;

            session = await AISession.create({
                customerPhone: contactId, 
                whatsappConversation: conversationText,
                chatHistory: [{ role: 'user', content: bodyText }],
                status: 'active'
            });
        }
        else {
            session.whatsappConversation += `\nCliente: ${bodyText}`;
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

        if (aiReplyText.includes('[CREAR_FOLIO_AHORA]')) {
            const partes = aiReplyText.split('[CREAR_FOLIO_AHORA]');
            const textoDespedida = partes[0]; 
            const posibleJson = partes[1].trim();
            
            let orderData = {};
            try {
                const matchJson = posibleJson.match(/\{[\s\S]*\}/);
                if (matchJson) orderData = JSON.parse(matchJson[0]);
                else throw new Error("No se encontró estructura JSON.");
            } catch (jsonError) {
                orderData = await getInitialExtraction(session.whatsappConversation); 
            }

            try {
                const esDomicilio = orderData.is_delivery === true || orderData.is_delivery === "true";

                // 🔥 FORZAMOS LA VERIFICACIÓN: Si la IA mandó pisos, ES Base/Especial obligatoriamente.
                const arrayPisosSafe = parseArraySafe(orderData.detallesPisos || orderData.pisos || orderData.detalles_pisos);
                const tipoFolioCalculado = arrayPisosSafe.length > 0 ? 'Base/Especial' : (orderData.tipo_folio || 'Normal');

                const nuevoFolio = await Folio.create({
                    cliente_nombre: orderData.cliente_nombre || orderData.nombre || 'Cliente WhatsApp',
                    cliente_telefono: orderData.cliente_telefono || contactId.replace('@c.us', ''),
                    cliente_telefono_extra: orderData.cliente_telefono_extra || null, 
                    
                    fecha_entrega: orderData.fecha_entrega || null,
                    hora_entrega: orderData.hora_entrega || null,
                    
                    is_delivery: esDomicilio,
                    calle: orderData.calle || null,
                    
                    // 🚀 FIX: Conectamos los campos extraídos por la IA hacia la Base de Datos
                    num_ext: orderData.num_ext || null,
                    num_int: orderData.num_int || null,
                    colonia: orderData.colonia || null,
                    referencias: orderData.referencias || null,
                    ubicacion_maps: orderData.ubicacion_maps || null,
                    
                    ubicacion_entrega: orderData.ubicacion_entrega || (esDomicilio ? 'Domicilio' : 'Sucursal'),
                    
                    numero_personas: orderData.numero_personas || 10,
                    forma: orderData.forma || null,
                    tipo_folio: tipoFolioCalculado,
                    
                    detallesPisos: arrayPisosSafe,
                    complementarios: parseArraySafe(orderData.complementarios),
                    sabores_pan: parseArraySafe(orderData.sabores_pan || orderData.sabor_pan), 
                    rellenos: parseArraySafe(orderData.rellenos || orderData.relleno),       
                    
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
                aiReplyText = textoDespedida + `\n\n⚠️ Hemos confirmado tu pedido, pero ocurrió un pequeño retraso al registrarlo en nuestro sistema. Lo revisaremos enseguida.`;
            }
        }

        const buscarFolioRegex = /\[BUSCAR_FOLIO:\s*#?(\d+)\]/i; 
        const folioMatch = aiReplyText.match(buscarFolioRegex);
        
        if (folioMatch) {
            const folioBuscado = folioMatch[1]; 
            aiReplyText = aiReplyText.replace(buscarFolioRegex, '').trim(); 

            try {
                const f = await Folio.findByPk(folioBuscado);
                if (f) {
                    const panes = parseArraySafe(f.sabores_pan);
                    const panTxt = panes.length > 0 ? panes.join(', ') : "No especificado";

                    const rellenos = parseArraySafe(f.rellenos);
                    const rellenoTxt = rellenos.length > 0 ? rellenos.join(', ') : "No especificado";
                    
                    const disenoTxt = f.descripcion_diseno || "Ninguno / Estándar";
                    const dedicatoriaTxt = f.dedicatoria || "Sin dedicatoria";
                    const entregaTxt = f.ubicacion_entrega || "Recoger en Sucursal";
                    
                    const pisosArray = parseArraySafe(f.detallesPisos);
                    let pisosTxt = '';
                    if (pisosArray.length > 0) {
                        pisosTxt = '\n' + pisosArray.map((p, i) => {
                            const panStr = Array.isArray(p.panes) ? p.panes.join(', ') : (p.panes || 'N/A');
                            const rellStr = Array.isArray(p.rellenos) ? p.rellenos.join(', ') : (p.rellenos || 'N/A');
                            return `   - Piso ${i + 1}: Para ${p.personas || '??'} pax | Notas: ${p.notas || 'Ninguna'} | Pan: ${panStr} | Relleno: ${rellStr}`;
                        }).join('\n');
                    } else {
                        pisosTxt = f.tipo_folio || "Normal";
                    }
                    
                    let precioTxt = "Por definir (El local te confirmará el total)";
                    if (f.total && parseFloat(f.total) > 0) precioTxt = `$${parseFloat(f.total).toFixed(2)}`;

                    const compArray = parseArraySafe(f.complementarios);
                    let complementariosTxt = '';
                    if (compArray.length > 0) {
                        complementariosTxt = '\n\n➕ *PASTELES COMPLEMENTARIOS*\n' + compArray.map((comp, idx) => 
                            `${idx + 1}️⃣ ${comp.forma || 'Extra'} - Pan: ${comp.pan || comp.sabor_pan || comp.flavor || comp.sabor || 'N/A'}, Relleno: ${comp.relleno || comp.filling || 'N/A'}`
                        ).join('\n');
                    }

                    aiReplyText += `\n\n📋 *DETALLES DE TU PEDIDO #${folioBuscado}*\n👤 *Nombre:* ${f.cliente_nombre}\n📅 *Fecha y Hora:* ${f.fecha_entrega || 'Pendiente'} a las ${f.hora_entrega || 'Pendiente'}\n📍 *Entrega:* ${entregaTxt}\n\n🎂 *PASTEL PRINCIPAL*\n🍰 *Tamaño:* ${f.numero_personas ? f.numero_personas + ' Personas' : 'Especificado en la Forma/Estructura'}\n💠 *Forma / Estilo:* ${f.forma || 'N/A'}\n🏢 *Estructura:* ${pisosTxt}\n🍞 *Pan principal:* ${panTxt}\n🍓 *Relleno principal:* ${rellenoTxt}\n🎨 *Diseño:* ${disenoTxt}\n✍️ *Dedicatoria:* ${dedicatoriaTxt}\n📸 *Imágenes:* Revisar fotos adjuntas en el chat (si aplica)${complementariosTxt}\n\n--------------------------\n💵 *Precio Total:* ${precioTxt}\n💰 *Estado de Pago:* ${f.estatus_pago}\n\nAquí tienes la información de tu pedido. Si necesitas alguna modificación, por favor comunícate directamente a la sucursal.\n\n_(🤖 El asistente se ha pausado. Escribe "Hola" o "Menú" para iniciar otra plática)_`;
                } else {
                    aiReplyText += `\n\n⚠️ Lo siento, no encontré ningún pedido con el folio *#${folioBuscado}*. Revisa el número e intenta de nuevo.`;
                }
                session.status = 'completed';
            } catch (err) {
                aiReplyText += `\n\n⚠️ Tuvimos un problema técnico. Intenta de nuevo en unos minutos.`;
            }
        }

        if (aiReplyText.includes('[FINALIZAR_SESION]')) {
            aiReplyText = aiReplyText.replace('[FINALIZAR_SESION]', '').trim();
            aiReplyText += `\n\n_(🤖 El asistente se ha pausado. Escribe "Hola" o "Menú" para iniciar otra plática)_`;
            session.status = 'completed';
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
    if (req.query.format === 'image') {
        if (!data.qr) return res.status(404).send('QR no listo');
        const qrcode = require('qrcode');
        res.setHeader('Content-Type', 'image/png');
        return qrcode.toFileStream(res, data.qr);
    }
    if (!data.qr && data.status !== 'ready') {
        return res.status(202).json({ message: 'QR Not Ready', status: data.status || 'initializing' });
    }
    return res.json(data);
});

exports.refreshSession = asyncHandler(async (req, res) => {
    await gateway.restart();
    res.json({ message: 'Reiniciando sesión de WhatsApp...' });
});