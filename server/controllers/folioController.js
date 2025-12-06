const fs = require('fs').promises;
const path = require('path');
const { format, parseISO, startOfWeek, endOfWeek, getDate, getMonth, lastDayOfMonth } = require('date-fns');
const { es } = require('date-fns/locale');
// Asegúrate que sequelize esté correctamente importado aquí desde ../models o ../config/database
const { Folio, Client, User, FolioEditHistory, Commission, sequelize } = require('../models');
const { Op } = require('sequelize');
const pdfService = require('../services/pdfService');


const calculateFillingCost = (folioType, persons, fillings, tiers) => {
    let cost = 0;
    if (folioType === 'Normal') {
        const numPersons = parseInt(persons, 10) || 0;
        // Asegurarse que fillings sea un array de objetos { name, hasCost }
        const validFillings = Array.isArray(fillings) ? fillings : [];
        cost = validFillings.reduce((sum, filling) => {
            // Usar Math.ceil para redondear hacia arriba por cada 20 personas o fracción
            return (filling && filling.hasCost && numPersons > 0) ? sum + (Math.ceil(numPersons / 20) * 30) : sum;
        }, 0);
    } else if (folioType === 'Base/Especial') {
        // Costo de relleno para Base/Especial podría necesitar lógica diferente si aplica.
        // Por ahora, asumimos que no tienen costo extra o se incluye en el 'total' base.
        // Si necesitaras calcularlo basado en tiers, tendrías que implementar esa lógica aquí.
        cost = 0;
    }
    return cost;
};

// --- CREAR un nuevo folio ---
exports.createFolio = async (req, res) => {
    // Siempre crear y gestionar la transacción aquí
    const t = await sequelize.transaction();

    try {
        const {
            clientName, clientPhone, clientPhone2, total, advancePayment, deliveryDate,
            tiers, accessories, additional, isPaid, hasExtraHeight, imageComments,
            cakeFlavor, filling, complements, addCommissionToCustomer, status, // Añadir status por si viene de AI
            // Campos de imágenes existentes (no deberían venir en creación directa, pero sí en mockReq de AI)
            existingImageUrls, existingImageComments,
            ...folioData
        } = req.body;

        // Validaciones básicas
        if (!clientName || !clientPhone || !deliveryDate || total === undefined || total === null || advancePayment === undefined || advancePayment === null) {
            throw new Error("Faltan campos obligatorios: nombre, teléfono, fecha, total o anticipo.");
        }


        // Buscar o crear cliente DENTRO de la transacción
        const [client, created] = await Client.findOrCreate({
            where: { phone: clientPhone },
            defaults: { name: clientName, phone2: clientPhone2 || null }, // Usar null si no viene
            transaction: t // <= Usar la transacción local 't'
        });

        // Actualizar phone2 si es diferente y el cliente ya existía
        if (!created && client.phone2 !== (clientPhone2 || null)) {
            await client.update({ phone2: clientPhone2 || null }, { transaction: t });
        }

        // Generar número de folio
        const lastFourDigits = String(client.phone).slice(-4); // Asegurar que sea string
        const date = parseISO(deliveryDate);
        const monthInitial = format(date, 'MMMM', { locale: es }).charAt(0).toUpperCase();
        const dayInitial = format(date, 'EEEE', { locale: es }).charAt(0).toUpperCase();
        const dayOfMonth = format(date, 'dd');

        let baseFolioNumber = `${monthInitial}${dayInitial}-${dayOfMonth}-${lastFourDigits}`;
        let finalFolioNumber = baseFolioNumber;
        let counter = 1;

        // Verificar unicidad DENTRO de la transacción para evitar race conditions
        let existingFolio = await Folio.findOne({ where: { folioNumber: finalFolioNumber }, transaction: t, lock: t.LOCK.UPDATE });
        while (existingFolio) {
            finalFolioNumber = `${baseFolioNumber}-${counter}`;
            counter++;
            existingFolio = await Folio.findOne({ where: { folioNumber: finalFolioNumber }, transaction: t, lock: t.LOCK.UPDATE });
        }

        // Parsear y validar datos JSON de forma segura
        const additionalData = JSON.parse(additional || '[]');
        const tiersData = JSON.parse(tiers || '[]');
        const rawFillingData = JSON.parse(filling || '[]');
        const fillingData = Array.isArray(rawFillingData)
            ? rawFillingData.map(f => (typeof f === 'string' ? { name: f, hasCost: false } : f)) // Asegurar formato {name, hasCost}
            : [];
        const complementsData = JSON.parse(complements || '[]');
        const cakeFlavorData = JSON.parse(cakeFlavor || '[]');

        // Calcular costo de relleno usando la función corregida
        const fillingCost = calculateFillingCost(folioData.folioType, folioData.persons, fillingData, tiersData);

        // Calcular costos adicionales (suma de precios en additionalData)
        const additionalCost = additionalData.reduce((sum, item) => sum + parseFloat(item.price || 0), 0);

        // Calcular total y comisión
        const applyCommission = addCommissionToCustomer === 'true' || addCommissionToCustomer === true;
        const baseCakeCost = parseFloat(total) || 0; // El 'total' que viene del body es el COSTO BASE del pastel
        const deliveryCostValue = parseFloat(folioData.deliveryCost || 0);

        const baseTotalBeforeCommission = baseCakeCost + deliveryCostValue + additionalCost + fillingCost;

        const commissionAmount = baseTotalBeforeCommission * 0.05; // Comisión exacta
        let roundedCommissionAmount = 0;
        let finalTotal = baseTotalBeforeCommission;

        if (applyCommission) {
            roundedCommissionAmount = Math.ceil(commissionAmount / 10) * 10; // Redondeo hacia arriba a la decena
            finalTotal += roundedCommissionAmount; // Sumar comisión redondeada al total final
        }

        // --- INICIO DE LA CORRECCIÓN isPaid vs balance ---
        let finalAdvancePayment = parseFloat(advancePayment) || 0;
        const isActuallyPaid = isPaid === 'true' || isPaid === true; // Convertir a booleano

        // Si está marcado como pagado, forzar el anticipo para que cubra el total
        if (isActuallyPaid) {
            finalAdvancePayment = finalTotal;
        }

        // Ahora calcula el balance con el finalAdvancePayment posiblemente ajustado
        const balance = finalTotal - finalAdvancePayment;
        // Determina el estado final de isPaid basado en el balance calculado
        const finalIsPaidStatus = balance <= 0;
        // --- FIN DE LA CORRECCIÓN isPaid vs balance ---

        // Manejar imágenes
        const newImageUrls = req.files ? req.files.map(file => file.path.replace(/\\/g, '/')) : []; // Normalizar slashes
        const aiImageUrls = JSON.parse(existingImageUrls || '[]').map(url => url.replace(/\\/g, '/')); // Normalizar slashes
        const imageUrls = [...aiImageUrls, ...newImageUrls];

        // Comentarios
        const newComments = JSON.parse(imageComments || '[]');
        const aiComments = JSON.parse(existingImageComments || '[]');
        // Asegurar que los comentarios coincidan con las imágenes finales
        const finalImageComments = imageUrls.map((url, index) => {
            if (index < aiImageUrls.length) return aiComments[index] || null; // Comentario de AI
            return newComments[index - aiImageUrls.length] || null; // Comentario de nueva imagen
        });


        const newFolioData = {
            ...folioData, // folioType, persons, shape, designDescription, etc.
            deliveryDate,
            deliveryTime: folioData.deliveryTime || '00:00:00',
            folioNumber: finalFolioNumber,
            total: finalTotal.toFixed(2),
            advancePayment: finalAdvancePayment.toFixed(2), // <= Usar la variable ajustada
            balance: balance.toFixed(2),                 // <= Usar el balance recalculado
            clientId: client.id,
            responsibleUserId: req.user?.id || null, // Usar null si req.user no existe (aunque debería)
            imageUrls: imageUrls.length > 0 ? imageUrls : null,
            imageComments: finalImageComments.some(c => c !== null) ? finalImageComments : null, // Guardar null si todos son null
            tiers: tiersData.length > 0 ? tiersData : null,
            accessories: accessories || null,
            additional: additionalData.length > 0 ? additionalData : null,
            cakeFlavor: cakeFlavorData.length > 0 ? cakeFlavorData : null,
            filling: fillingData.length > 0 ? fillingData : null,
            complements: complementsData.length > 0 ? complementsData : null,
            isPaid: finalIsPaidStatus, // <= Establecer isPaid basado en el balance real
            hasExtraHeight: hasExtraHeight === 'true' || hasExtraHeight === true,
            status: status === 'Nuevo' ? 'Nuevo' : (folioData.status || 'Nuevo') // Default a 'Nuevo'
        };

        // Crear el folio DENTRO de la transacción
        const newFolio = await Folio.create(newFolioData, { transaction: t });

        // Crear registro de comisión DENTRO de la transacción
        await Commission.create({
            folioId: newFolio.id,
            folioNumber: newFolio.folioNumber,
            amount: commissionAmount.toFixed(2),
            appliedToCustomer: applyCommission,
            roundedAmount: applyCommission ? roundedCommissionAmount.toFixed(2) : null
        }, { transaction: t });

        await t.commit();
        console.log(`✅ Folio ${newFolio.folioNumber} creado exitosamente.`);

        res.status(201).json(newFolio);

    } catch (error) {
        // Si la transacción sigue activa, hacer rollback
        if (t && !t.finished) {
            await t.rollback();
        }
        console.error('❌ ERROR DETALLADO AL CREAR FOLIO:', error);
        res.status(400).json({ message: `Error al crear el folio: ${error.message}`, error: error.stack });
    }
};

// --- OBTENER TODOS los folios ---
exports.getAllFolios = async (req, res) => {
    try {
        const { q, status } = req.query;
        let whereClause = {};

        if (q) {
            const searchTerm = `%${q}%`;
            whereClause = {
                [Op.or]: [
                    { folioNumber: { [Op.like]: searchTerm } },
                    { '$client.name$': { [Op.like]: searchTerm } },
                    { '$client.phone$': { [Op.like]: searchTerm } },
                    { '$client.phone2$': { [Op.like]: searchTerm } }
                ]
            };
        }

        if (status) {
            whereClause.status = status;
        } else {
            // Excluir pendientes por defecto si no se pide un status específico
            whereClause.status = { [Op.ne]: 'Pendiente' };
        }


        const folios = await Folio.findAll({
            where: whereClause,
            include: [
                { model: Client, as: 'client', attributes: ['name', 'phone', 'phone2'], required: false },
                { model: User, as: 'responsibleUser', attributes: ['username'], required: false } // Hacer opcional por si el usuario fue eliminado
            ],
            // Ordenar por fecha y hora, excepto si se piden los pendientes (más nuevos primero)
            order: status === 'Pendiente' ? [['createdAt', 'DESC']] : [['deliveryDate', 'ASC'], ['deliveryTime', 'ASC']]
        });
        res.status(200).json(folios);
    } catch (error) {
        console.error("Error en getAllFolios:", error);
        res.status(500).json({ message: 'Error al obtener los folios', error: error.message });
    }
};

// --- OBTENER UN SOLO folio por su ID ---
exports.getFolioById = async (req, res) => {
    try {
        const folioId = req.params.id;
        // Validar que el ID sea un número
        if (isNaN(folioId)) {
            return res.status(400).json({ message: 'ID de folio inválido.' });
        }

        const folio = await Folio.findByPk(folioId, {
            include: [
                { model: Client, as: 'client', attributes: ['name', 'phone', 'phone2'], required: false },
                { model: User, as: 'responsibleUser', attributes: ['username'], required: false },
                // Asegúrate que el alias 'commission' esté definido en models/index.js
                { model: Commission, as: 'commission', required: false },
                {
                    model: FolioEditHistory,
                    as: 'editHistory',
                    attributes: ['createdAt'],
                    include: { model: User, as: 'editor', attributes: ['username'], required: false },
                    order: [['createdAt', 'ASC']],
                    required: false
                }
            ]
        });
        if (!folio) { return res.status(404).json({ message: 'Folio no encontrado' }); }
        res.status(200).json(folio);
    } catch (error) {
        console.error(`Error en getFolioById (${req.params.id}):`, error);
        res.status(500).json({ message: 'Error al obtener el folio', error: error.message });
    }
};

// --- ACTUALIZAR un folio existente ---
exports.updateFolio = async (req, res) => {
    const folioId = req.params.id;
    // Validar ID
    if (isNaN(folioId)) {
        return res.status(400).json({ message: 'ID de folio inválido.' });
    }

    const t = await sequelize.transaction();
    try {
        const folio = await Folio.findByPk(folioId, { transaction: t, lock: t.LOCK.UPDATE });
        if (!folio) {
            await t.rollback();
            return res.status(404).json({ message: 'Folio no encontrado' });
        }
        // No permitir edición si está cancelado
        if (folio.status === 'Cancelado') {
            await t.rollback();
            return res.status(400).json({ message: 'No se puede editar un folio cancelado.' });
        }

        const {
            clientName, clientPhone, clientPhone2, total, advancePayment, deliveryDate,
            tiers, accessories, additional, isPaid, hasExtraHeight, imageComments,
            existingImageUrls, existingImageComments, cakeFlavor, filling,
            complements, addCommissionToCustomer, status, // Permitir actualizar status
            ...folioData // Resto de campos: folioType, persons, shape, designDescription, dedication, deliveryLocation, deliveryCost
        } = req.body;

        // Actualizar cliente asociado (si existe)
        if (folio.clientId) {
            const client = await Client.findByPk(folio.clientId, { transaction: t });
            if (client) {
                await client.update({ name: clientName, phone: clientPhone, phone2: clientPhone2 || null }, { transaction: t });
            } else {
                console.warn(`Cliente con ID ${folio.clientId} no encontrado para el folio ${folio.folioNumber} durante la actualización.`);
                // Considerar si esto debe ser un error o solo una advertencia
            }
        } else {
            // Si el folio no tenía cliente, ¿debería buscar/crear uno ahora?
            // Por simplicidad, asumimos que si no tenía, no se actualiza.
            console.warn(`Folio ${folio.folioNumber} no tiene un cliente asociado. No se actualizarán datos del cliente.`);
        }


        // Parsear datos JSON
        const additionalData = JSON.parse(additional || '[]');
        const tiersData = JSON.parse(tiers || '[]');
        const rawFillingData = JSON.parse(filling || '[]');
        const fillingData = Array.isArray(rawFillingData)
            ? rawFillingData.map(f => (typeof f === 'string' ? { name: f, hasCost: false } : f))
            : [];
        const complementsData = JSON.parse(complements || '[]');
        const cakeFlavorData = JSON.parse(cakeFlavor || '[]');

        // Recalcular costos
        const currentFolioType = folioData.folioType || folio.folioType; // Usar nuevo tipo si se envía, si no el actual
        const currentPersons = folioData.persons || folio.persons;
        const fillingCost = calculateFillingCost(currentFolioType, currentPersons, fillingData, tiersData);
        const additionalCost = additionalData.reduce((sum, item) => sum + parseFloat(item.price || 0), 0);
        const applyCommission = addCommissionToCustomer === 'true' || addCommissionToCustomer === true;
        const baseCakeCost = parseFloat(total) || 0;
        const deliveryCostValue = parseFloat(folioData.deliveryCost || folio.deliveryCost || 0); // Usar nuevo, luego actual, luego 0

        const baseTotalBeforeCommission = baseCakeCost + deliveryCostValue + additionalCost + fillingCost;
        const commissionAmount = baseTotalBeforeCommission * 0.05;
        let roundedCommissionAmount = 0;
        let finalTotal = baseTotalBeforeCommission;
        if (applyCommission) {
            roundedCommissionAmount = Math.ceil(commissionAmount / 10) * 10;
            finalTotal += roundedCommissionAmount;
        }

        // --- INICIO DE LA CORRECCIÓN isPaid vs balance ---
        let finalAdvancePayment = parseFloat(advancePayment) || 0;
        const isActuallyPaid = isPaid === 'true' || isPaid === true; // Convertir a booleano

        // Si está marcado como pagado, forzar el anticipo para que cubra el total
        if (isActuallyPaid) {
            finalAdvancePayment = finalTotal;
        }

        // Ahora calcula el balance con el finalAdvancePayment posiblemente ajustado
        const balance = finalTotal - finalAdvancePayment;
        // Determina el estado final de isPaid basado en el balance calculado
        const finalIsPaidStatus = balance <= 0;
        // --- FIN DE LA CORRECCIÓN isPaid vs balance ---


        // Manejar imágenes
        const currentExistingUrls = JSON.parse(existingImageUrls || '[]').map(url => url.replace(/\\/g, '/')); // Normalizar
        const newImageUrls = req.files ? req.files.map(file => file.path.replace(/\\/g, '/')) : []; // Normalizar
        const finalImageUrls = [...currentExistingUrls, ...newImageUrls];

        // Manejar comentarios
        const currentExistingComments = JSON.parse(existingImageComments || '[]');
        const newComments = JSON.parse(imageComments || '[]');
        // Asociar comentarios correctamente
        const finalImageComments = finalImageUrls.map((url, index) => {
            if (index < currentExistingUrls.length) return currentExistingComments[index] || null;
            return newComments[index - currentExistingUrls.length] || null;
        });


        // Datos para actualizar en el folio
        const updateData = {
            ...folioData, // folioType, persons, shape, etc., si vienen en req.body
            deliveryDate: deliveryDate || folio.deliveryDate,
            deliveryTime: folioData.deliveryTime || folio.deliveryTime,
            total: finalTotal.toFixed(2),
            advancePayment: finalAdvancePayment.toFixed(2), // <= Usar la variable ajustada
            balance: balance.toFixed(2),                 // <= Usar el balance recalculado
            imageUrls: finalImageUrls.length > 0 ? finalImageUrls : null,
            imageComments: finalImageComments.some(c => c !== null) ? finalImageComments : null,
            tiers: tiersData.length > 0 ? tiersData : null,
            accessories: accessories || null, // Permitir vaciar con null
            additional: additionalData.length > 0 ? additionalData : null,
            cakeFlavor: cakeFlavorData.length > 0 ? cakeFlavorData : null,
            filling: fillingData.length > 0 ? fillingData : null,
            complements: complementsData.length > 0 ? complementsData : null,
            isPaid: finalIsPaidStatus, // <= Establecer isPaid basado en el balance real
            hasExtraHeight: hasExtraHeight === 'true' || hasExtraHeight === true,
            // Actualizar status solo si se proporciona explícitamente y es válido
            ...(status && ['Pendiente', 'Nuevo', 'En Producción', 'Listo para Entrega', 'Entregado', 'Cancelado'].includes(status) && { status: status })
        };

        // Limpiar campos según folioType si este cambia
        if (folioData.folioType && folioData.folioType !== folio.folioType) {
            if (folioData.folioType === 'Base/Especial') {
                updateData.cakeFlavor = null;
                updateData.filling = null;
            } else { // Cambia a Normal
                updateData.tiers = null;
            }
        }


        await folio.update(updateData, { transaction: t });

        // Actualizar o crear registro de comisión
        let commission = await Commission.findOne({ where: { folioId: folio.id }, transaction: t });
        const commissionUpdateData = {
            folioNumber: folio.folioNumber, // Usar número de folio actual
            amount: commissionAmount.toFixed(2),
            appliedToCustomer: applyCommission,
            roundedAmount: applyCommission ? roundedCommissionAmount.toFixed(2) : null
        };
        if (commission) {
            await commission.update(commissionUpdateData, { transaction: t });
        } else {
            await Commission.create({ folioId: folio.id, ...commissionUpdateData }, { transaction: t });
        }

        // Registrar la edición en el historial
        await FolioEditHistory.create({ folioId: folioId, editorUserId: req.user?.id || null }, { transaction: t });

        await t.commit();
        console.log(`✅ Folio ${folio.folioNumber} actualizado exitosamente.`);
        // Devolver el folio actualizado
        const updatedFolio = await Folio.findByPk(folioId, { include: [{ model: Client, as: 'client', required: false }] }); // Volver a buscar con cliente
        res.status(200).json(updatedFolio);

    } catch (error) {
        if (t && !t.finished) {
            await t.rollback();
        }
        console.error(`❌ ERROR AL ACTUALIZAR FOLIO ${folioId}:`, error);
        res.status(400).json({ message: `Error al actualizar el folio: ${error.message}`, error: error.stack });
    }
};


// --- ELIMINAR un folio ---
exports.deleteFolio = async (req, res) => {
    const folioId = req.params.id;
    if (isNaN(folioId)) return res.status(400).json({ message: 'ID de folio inválido.' });

    const t = await sequelize.transaction();
    try {
        const folio = await Folio.findByPk(folioId, { transaction: t });
        if (!folio) {
            await t.rollback();
            return res.status(404).json({ message: 'Folio no encontrado' });
        }

        // Eliminar imágenes asociadas
        if (folio.imageUrls && folio.imageUrls.length > 0) {
            for (const imageUrl of folio.imageUrls) {
                try {
                    const imagePath = path.resolve(__dirname, '..', '..', imageUrl);
                    await fs.unlink(imagePath);
                    console.log(`Imagen eliminada: ${imagePath}`);
                } catch (err) {
                    console.error(`No se pudo eliminar la imagen ${imageUrl}:`, err.code === 'ENOENT' ? 'Archivo no encontrado.' : err.message);
                }
            }
        }

        // Eliminar registros relacionados ANTES de eliminar el folio
        await Commission.destroy({ where: { folioId: folio.id }, transaction: t });
        await FolioEditHistory.destroy({ where: { folioId: folio.id }, transaction: t });

        // Eliminar el folio
        const folioNumber = folio.folioNumber; // Guardar para log
        await folio.destroy({ transaction: t });

        await t.commit();
        console.log(`✅ Folio ${folioNumber} eliminado correctamente.`);
        res.status(200).json({ message: 'Folio eliminado correctamente' });

    } catch (error) {
        if (t && !t.finished) {
            await t.rollback();
        }
        console.error(`❌ Error al eliminar el folio ${folioId}:`, error);
        res.status(500).json({ message: 'Error al eliminar el folio', error: error.message });
    }
};

// --- Resto de funciones (generateFolioPdf, markAsPrinted, cancelFolio, generateDaySummaryPdf, generateLabelPdf, getStatistics, getProductivityStats, generateCommissionReport, updateFolioStatus) ---

// --- GENERAR PDF INDIVIDUAL ---
exports.generateFolioPdf = async (req, res) => {
    try {
        const folioId = req.params.id;
        if (isNaN(folioId)) return res.status(400).json({ message: 'ID de folio inválido.' });

        const folio = await Folio.findByPk(folioId, {
            include: [
                { model: Client, as: 'client', required: false },
                { model: User, as: 'responsibleUser', required: false } // Usuario que creó/último editó? Asumimos creador por ahora
            ]
        });
        if (!folio) { return res.status(404).json({ message: 'Folio no encontrado' }); }
        if (folio.status === 'Pendiente') {
            return res.status(400).json({ message: 'No se puede generar PDF para un folio pendiente. Confírmalo primero.' });
        }

        // Generación de Ruta de Archivo (asegurar que deliveryDate sea válida)
        let filePath;
        let fileName = `Folio-${folio.folioNumber}.pdf`; // Nombre base
        try {
            const deliveryDate = parseISO(folio.deliveryDate);
            if (isNaN(deliveryDate)) throw new Error('Fecha de entrega inválida');

            const month = format(deliveryDate, 'MMMM', { locale: es });
            const weekOptions = { weekStartsOn: 1 };
            const startOfWeekDate = startOfWeek(deliveryDate, weekOptions);
            const endOfWeekDate = endOfWeek(deliveryDate, weekOptions);
            let weekStartDay = getDate(startOfWeekDate);
            let weekEndDay = getDate(endOfWeekDate);
            if (getMonth(startOfWeekDate) !== getMonth(deliveryDate)) { weekStartDay = 1; }
            if (getMonth(endOfWeekDate) !== getMonth(deliveryDate)) { weekEndDay = getDate(lastDayOfMonth(deliveryDate)); }
            const weekFolder = `Semana ${weekStartDay}-${weekEndDay}`;
            const dayName = format(deliveryDate, 'EEEE dd', { locale: es });
            const dayFolder = `${dayName} de ${month}`;
            const directoryPath = path.resolve(__dirname, '..', '..', 'FOLIOS_GENERADOS', month, weekFolder, dayFolder);

            await fs.mkdir(directoryPath, { recursive: true });
            filePath = path.join(directoryPath, fileName);
        } catch (dateError) {
            console.error(`Error procesando fecha o creando directorios para folio ${folio.folioNumber}:`, dateError);
            // Considerar guardar en una carpeta por defecto o devolver error
            const fallbackDir = path.resolve(__dirname, '..', '..', 'FOLIOS_GENERADOS', '_ERRORES');
            await fs.mkdir(fallbackDir, { recursive: true });
            filePath = path.join(fallbackDir, fileName);
            console.warn(`Guardando PDF en directorio de errores: ${filePath}`);
        }


        // Preparación de Datos para PDF
        const folioDataForPdf = folio.toJSON();

        // Parsear JSON fields (con manejo de errores)
        ['tiers', 'cakeFlavor', 'filling', 'additional', 'complements'].forEach(key => {
            if (folioDataForPdf[key] && typeof folioDataForPdf[key] === 'string') {
                try {
                    folioDataForPdf[key] = JSON.parse(folioDataForPdf[key]);
                } catch (e) {
                    console.error(`Error al parsear JSON del campo '${key}' para PDF del folio ${folio.folioNumber}:`, e);
                    folioDataForPdf[key] = (key === 'tiers' || key === 'cakeFlavor' || key === 'filling' || key === 'additional' || key === 'complements') ? [] : null; // Default a array vacío o null
                }
            }
            // Asegurar que sean arrays si no son null
            if (['tiers', 'cakeFlavor', 'filling', 'additional', 'complements'].includes(key) && folioDataForPdf[key] === null) {
                folioDataForPdf[key] = [];
            }
            // Asegurar formato {name, hasCost} para filling
            if (key === 'filling' && Array.isArray(folioDataForPdf[key])) {
                folioDataForPdf[key] = folioDataForPdf[key].map(f => (typeof f === 'string' ? { name: f, hasCost: false } : f));
            }

        });


        // Formatear arrays para display
        folioDataForPdf.displayCakeFlavor = Array.isArray(folioDataForPdf.cakeFlavor) ? folioDataForPdf.cakeFlavor.join(', ') || 'N/A' : 'N/A';
        folioDataForPdf.displayFilling = Array.isArray(folioDataForPdf.filling) ? folioDataForPdf.filling.map(f => `${f.name}${f.hasCost ? ' ($)' : ''}`).join('; ') || 'N/A' : 'N/A';


        // Colores y fecha/hora formateada
        try {
            const deliveryDate = parseISO(folio.deliveryDate);
            const dayOfWeek = format(deliveryDate, 'EEEE', { locale: es });
            // ... (lógica de colores igual que antes) ...
            let dayColor = '#F8F9FA'; let textColor = '#212529';
            switch (dayOfWeek.toLowerCase()) { /* ... casos ... */
                case 'lunes': dayColor = '#0d6efd'; textColor = '#ffffff'; break;
                case 'martes': dayColor = '#6f42c1'; textColor = '#ffffff'; break;
                case 'miércoles': dayColor = '#fd7e14'; textColor = '#ffffff'; break;
                case 'jueves': dayColor = '#198754'; textColor = '#ffffff'; break;
                case 'viernes': dayColor = '#d63384'; textColor = '#ffffff'; break;
                case 'sábado': dayColor = '#ffc107'; textColor = '#000000'; break;
                case 'domingo': dayColor = '#adb5bd'; textColor = '#000000'; break;
            }
            folioDataForPdf.dayColor = dayColor;
            folioDataForPdf.textColor = textColor;
            folioDataForPdf.formattedDeliveryDate = format(deliveryDate, "EEEE dd 'de' MMMM 'de' yyyy", { locale: es });
        } catch (e) {
            folioDataForPdf.formattedDeliveryDate = "Fecha inválida";
            folioDataForPdf.dayColor = '#F8F9FA';
            folioDataForPdf.textColor = '#212529';
        }

        if (folio.deliveryTime) {
            try {
                const [hour, minute] = folio.deliveryTime.split(':');
                const time = new Date(); time.setHours(hour, minute);
                folioDataForPdf.formattedDeliveryTime = format(time, 'h:mm a');
            } catch (e) { folioDataForPdf.formattedDeliveryTime = 'Hora inválida'; }
        } else {
            folioDataForPdf.formattedDeliveryTime = 'N/A';
        }

        // Asegurar datos de usuario y cliente para el template
        folioDataForPdf.responsibleUser = folio.responsibleUser ? { username: folio.responsibleUser.username } : { username: 'Desconocido' };
        folioDataForPdf.client = folio.client ? folio.client.toJSON() : { name: 'N/A', phone: 'N/A', phone2: null };

        // --- CORRECCIÓN FINAL: Convertir imágenes a Base64 para incrustar ---
        if (folioDataForPdf.imageUrls && Array.isArray(folioDataForPdf.imageUrls)) {
            const base64Images = await Promise.all(folioDataForPdf.imageUrls.map(async (url) => {
                try {
                    // 1. Obtener ruta absoluta del archivo
                    const relativePath = url.startsWith('/') ? url.slice(1) : url;
                    const absolutePath = path.resolve(__dirname, '..', '..', relativePath);

                    // 2. Leer el archivo del disco
                    const imageBuffer = await fs.readFile(absolutePath);

                    // 3. Detectar tipo (PNG o JPEG)
                    const mimeType = path.extname(absolutePath).toLowerCase() === '.png' ? 'image/png' : 'image/jpeg';

                    // 4. Retornar cadena Base64 lista para el HTML
                    return `data:${mimeType};base64,${imageBuffer.toString('base64')}`;
                } catch (err) {
                    console.error(`❌ Error leyendo imagen para PDF (${url}):`, err.message);
                    return null;
                }
            }));

            // Filtrar imágenes que fallaron (null) y actualizar el array
            folioDataForPdf.imageUrls = base64Images.filter(img => img !== null);
            console.log(`📸 [PDF DEBUG] ${folioDataForPdf.imageUrls.length} imágenes convertidas a Base64.`);
        } else {
            console.log('ℹ️ [PDF DEBUG] El folio no tiene imágenes para el PDF.');
        }

        // Generación y Envío del PDF
        const pdfBuffer = await pdfService.createPdf(folioDataForPdf);
        await fs.writeFile(filePath, pdfBuffer);
        console.log(`✅ PDF guardado en: ${filePath}`);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);
        res.send(pdfBuffer);

    } catch (error) {
        console.error(`❌ Error al generar PDF para folio ${req.params.id}:`, error);
        res.status(500).json({ message: 'Error al generar el PDF', error: error.message });
    }
};

// --- MARK AS PRINTED ---
exports.markAsPrinted = async (req, res) => {
    try {
        const folio = await Folio.findByPk(req.params.id);
        if (!folio) return res.status(404).json({ message: 'Folio no encontrado' });
        await folio.update({ isPrinted: true });
        res.status(200).json({ message: 'Folio marcado como impreso.' });
    } catch (error) {
        console.error(`Error marcando impreso folio ${req.params.id}:`, error);
        res.status(500).json({ message: 'Error al marcar como impreso', error: error.message });
    }
};

// --- CANCEL FOLIO ---
exports.cancelFolio = async (req, res) => {
    try {
        const folio = await Folio.findByPk(req.params.id);
        if (!folio) return res.status(404).json({ message: 'Folio no encontrado' });
        if (folio.status === 'Cancelado') return res.status(400).json({ message: 'El folio ya está cancelado.' });
        await folio.update({ status: 'Cancelado' });
        console.log(`Folio ${folio.folioNumber} cancelado.`);
        res.status(200).json({ message: 'El folio ha sido cancelado.' });
    } catch (error) {
        console.error(`Error cancelando folio ${req.params.id}:`, error);
        res.status(500).json({ message: 'Error al cancelar el folio', error: error.message });
    }
};

// --- GENERATE DAY SUMMARY PDF ---
exports.generateDaySummaryPdf = async (req, res) => {
    const { date, type } = req.query;
    if (!date || !type || !['labels', 'orders'].includes(type)) {
        return res.status(400).json({ message: 'Parámetros inválidos.' });
    }
    try {
        const foliosDelDia = await Folio.findAll({
            where: { deliveryDate: date, status: { [Op.ne]: 'Cancelado' } },
            include: [{ model: Client, as: 'client', required: false }],
            order: [['deliveryTime', 'ASC']]
        });
        if (foliosDelDia.length === 0) return res.status(404).send(`<html><body><h1>No hay folios activos para ${date}.</h1></body></html>`);

        let pdfBuffer;
        let pdfData = [];
        if (type === 'labels') {
            foliosDelDia.forEach(folio => {
                const folioJson = folio.toJSON();
                let labelCounter = 1;

                // ===== INICIO DE LA CORRECCIÓN =====
                // Parsear JSON fields de forma segura (revisando si es string primero)
                if (typeof folioJson.tiers === 'string') {
                    try { folioJson.tiers = JSON.parse(folioJson.tiers || '[]'); } catch (e) { folioJson.tiers = []; }
                } else if (!Array.isArray(folioJson.tiers)) {
                    folioJson.tiers = []; // Asegurar que sea array si es null o inválido
                }

                if (typeof folioJson.complements === 'string') {
                    try { folioJson.complements = JSON.parse(folioJson.complements || '[]'); } catch (e) { folioJson.complements = []; }
                } else if (!Array.isArray(folioJson.complements)) {
                    folioJson.complements = []; // Asegurar que sea array
                }

                let hasTiers = folioJson.tiers.length > 0;
                let hasComplements = folioJson.complements.length > 0;

                // Caso 1: Es un pastel "simple" (Normal sin complementos, o Base/Especial sin tiers ni complementos)
                if (!hasTiers && !hasComplements) {
                    pdfData.push({ ...folioJson, folioNumber: folio.folioNumber, id: folio.id, labelType: 'main' });
                } else {
                    // Caso 2: Es un pastel con partes

                    // Parte A: El pastel principal (ya sea Normal o el "principal" de un Base/Especial sin tiers)
                    // Si es "Normal" O (es "Base/Especial" PERO no tiene tiers definidos), imprime la etiqueta principal.
                    if (folio.folioType === 'Normal' || (folio.folioType === 'Base/Especial' && !hasTiers)) {
                        pdfData.push({ ...folioJson, folioNumber: `${folio.folioNumber}-P${labelCounter++}`, id: folio.id, labelType: 'main' });
                    }

                    // Parte B: Los Tiers (si existen)
                    if (hasTiers) {
                        folioJson.tiers.forEach((tier, i) => pdfData.push({ ...folioJson, folioNumber: `${folio.folioNumber}-P${labelCounter++}`, persons: tier.persons, shape: tier.notas || folio.shape, cakeFlavor: null, filling: null, id: `${folio.id}-T${i}`, labelType: 'tier' }));
                    }

                    // Parte C: Los Complementos (si existen)
                    if (hasComplements) {
                        folioJson.complements.forEach((comp, i) => pdfData.push({ ...folioJson, folioNumber: `${folio.folioNumber}-C${labelCounter++}`, persons: comp.persons, shape: comp.shape || 'Comp.', cakeFlavor: null, filling: null, id: `${folio.id}-C${i}`, labelType: 'complement' }));
                    }
                }
                // ===== FIN DE LA CORRECCIÓN =====

            });
            if (pdfData.length === 0) return res.status(404).send(`<html><body><h1>No se generaron etiquetas para ${date}.</h1></body></html>`);
            pdfBuffer = await pdfService.createLabelsPdf(pdfData);
        } else { // type === 'orders'
            pdfData = foliosDelDia.filter(f => f.deliveryLocation && !f.deliveryLocation.toLowerCase().includes('recoge en tienda'));
            if (pdfData.length === 0) return res.status(404).send(`<html><body><h1>No hay comandas de envío para ${date}.</h1></body></html>`);
            pdfBuffer = await pdfService.createOrdersPdf(pdfData);
        }

        const fileName = `Resumen_${type}_${date}.pdf`;
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);
        res.send(pdfBuffer);
    } catch (error) {
        console.error(`Error PDF masivo (${type}) ${date}:`, error);
        res.status(500).json({ message: 'Error al generar PDF masivo', error: error.message });
    }
};

// --- GENERATE LABEL PDF (Individual) ---
exports.generateLabelPdf = async (req, res) => {
    try {
        const folioId = req.params.id;
        if (isNaN(folioId)) return res.status(400).json({ message: 'ID inválido.' });

        const folio = await Folio.findByPk(folioId, { include: [{ model: Client, as: 'client', required: false }] });
        if (!folio) return res.status(404).send(`<html><body><h1>Folio ${folioId} no encontrado.</h1></body></html>`);
        if (folio.status === 'Cancelado') return res.status(400).send(`<html><body><h1>Folio ${folio.folioNumber} cancelado.</h1></body></html>`);

        const labelsToPrint = [];
        const folioJson = folio.toJSON();
        let labelCounter = 1;

        // ===== INICIO DE LA CORRECCIÓN =====
        // Parse JSON fields safely before using them
        if (typeof folioJson.tiers === 'string') {
            try { folioJson.tiers = JSON.parse(folioJson.tiers || '[]'); } catch (e) { folioJson.tiers = []; }
        } else if (!Array.isArray(folioJson.tiers)) {
            folioJson.tiers = []; // Asegurar que sea array si es null o inválido
        }

        if (typeof folioJson.complements === 'string') {
            try { folioJson.complements = JSON.parse(folioJson.complements || '[]'); } catch (e) { folioJson.complements = []; }
        } else if (!Array.isArray(folioJson.complements)) {
            folioJson.complements = []; // Asegurar que sea array
        }

        let hasTiers = folioJson.tiers.length > 0;
        let hasComplements = folioJson.complements.length > 0;

        // Caso 1: Es un pastel "simple" (Normal sin complementos, o Base/Especial sin tiers ni complementos)
        if (!hasTiers && !hasComplements) {
            labelsToPrint.push({ ...folioJson, folioNumber: folio.folioNumber, id: folio.id, labelType: 'main' });
        } else {
            // Caso 2: Es un pastel con partes

            // Parte A: El pastel principal (ya sea Normal o el "principal" de un Base/Especial sin tiers)
            if (folio.folioType === 'Normal' || (folio.folioType === 'Base/Especial' && !hasTiers)) {
                labelsToPrint.push({ ...folioJson, folioNumber: `${folio.folioNumber}-P${labelCounter++}`, id: folio.id, labelType: 'main' });
            }

            // Parte B: Los Tiers (si existen)
            if (hasTiers) {
                folioJson.tiers.forEach((tier, i) => labelsToPrint.push({ ...folioJson, folioNumber: `${folio.folioNumber}-P${labelCounter++}`, persons: tier.persons, shape: tier.notas || folio.shape, cakeFlavor: null, filling: null, id: `${folio.id}-T${i}`, labelType: 'tier' }));
            }

            // Parte C: Los Complementos (si existen)
            if (hasComplements) {
                folioJson.complements.forEach((comp, i) => labelsToPrint.push({ ...folioJson, folioNumber: `${folio.folioNumber}-C${labelCounter++}`, persons: comp.persons, shape: comp.shape || 'Comp.', cakeFlavor: null, filling: null, id: `${folio.id}-C${i}`, labelType: 'complement' }));
            }
        }
        // ===== FIN DE LA CORRECCIÓN =====

        if (labelsToPrint.length === 0) return res.status(404).send(`<html><body><h1>No se generaron etiquetas para folio ${folio.folioNumber}.</h1></body></html>`);

        const pdfBuffer = await pdfService.createLabelsPdf(labelsToPrint);
        const fileName = `Etiqueta_Folio-${folio.folioNumber}.pdf`;
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);
        res.send(pdfBuffer);

    } catch (error) {
        console.error(`Error PDF etiqueta ${req.params.id}:`, error);
        res.status(500).json({ message: 'Error al generar PDF de etiqueta', error: error.message });
    }
};

// --- GET STATISTICS ---
exports.getStatistics = async (req, res) => {
    try {
        const folios = await Folio.findAll({
            attributes: ['folioType', 'cakeFlavor', 'filling', 'tiers'],
            where: { status: { [Op.ne]: 'Cancelado' } }
        });

        const stats = { normal: { flavors: {}, fillings: {} }, special: { flavors: {}, fillings: {} } };
        const incrementCount = (obj, key) => {
            if (!key || typeof key !== 'string' || key.trim() === '' || key.toLowerCase() === 'n/a') return;
            const normalizedKey = key.trim();
            obj[normalizedKey] = (obj[normalizedKey] || 0) + 1;
        };

        for (const folio of folios) {
            try {
                let flavors = [], fillings = [], tiers = [];
                // Safely parse JSON fields
                try { flavors = JSON.parse(folio.cakeFlavor || '[]'); if (!Array.isArray(flavors)) flavors = [flavors].filter(Boolean); } catch (e) { flavors = [folio.cakeFlavor].filter(Boolean); }
                try { fillings = JSON.parse(folio.filling || '[]'); if (!Array.isArray(fillings)) fillings = [fillings].filter(Boolean); } catch (e) { fillings = [folio.filling].filter(Boolean); }
                try { tiers = JSON.parse(folio.tiers || '[]'); if (!Array.isArray(tiers)) tiers = []; } catch (e) { tiers = []; }

                if (folio.folioType === 'Normal') {
                    flavors.forEach(f => incrementCount(stats.normal.flavors, f));
                    fillings.forEach(f => incrementCount(stats.normal.fillings, f?.name || f)); // Handle string or object
                } else if (folio.folioType === 'Base/Especial') {
                    tiers.forEach(tier => {
                        (tier?.panes || []).forEach(p => incrementCount(stats.special.flavors, p));
                        (tier?.rellenos || []).forEach(rStr => (rStr || '').split(';').forEach(r => incrementCount(stats.special.fillings, r.trim())));
                    });
                }
            } catch (procErr) { console.error("Error procesando stats folio:", procErr); }
        }

        const sortData = (dataObj) => Object.entries(dataObj).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
        const finalStats = { normal: { flavors: sortData(stats.normal.flavors), fillings: sortData(stats.normal.fillings) }, special: { flavors: sortData(stats.special.flavors), fillings: sortData(stats.special.fillings) } };
        res.status(200).json(finalStats);
    } catch (error) {
        console.error("Error en getStatistics:", error);
        res.status(500).json({ message: 'Error al generar estadísticas', error: error.message });
    }
};

// --- GET PRODUCTIVITY STATS ---
exports.getProductivityStats = async (req, res) => {
    try {
        const { date } = req.query;
        if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return res.status(400).json({ message: 'Fecha inválida (YYYY-MM-DD).' });
        const stats = await Folio.findAll({
            where: { createdAt: { [Op.gte]: `${date} 00:00:00`, [Op.lte]: `${date} 23:59:59` } },
            attributes: [
                'responsibleUserId',
                [sequelize.fn('COUNT', sequelize.col('Folio.id')), 'folioCount']
            ],
            include: [{
                model: User,
                as: 'responsibleUser',
                attributes: ['username']
            }],
            group: ['responsibleUserId', 'responsibleUser.id', 'responsibleUser.username'], // Include username in group by
            raw: false, // Set raw to false to get Sequelize model instances
            order: [[sequelize.literal('folioCount'), 'DESC']]
        });
        // Access nested properties correctly
        const formattedStats = stats.map(s => ({
            userId: s.responsibleUserId,
            username: s.responsibleUser?.username || 'Desconocido', // Use optional chaining
            folioCount: s.get('folioCount') // Use get() for aggregated values when raw is false
        }));
        res.status(200).json(formattedStats);
    } catch (error) {
        console.error(`Error getProductivityStats ${req.query.date}:`, error);
        res.status(500).json({ message: 'Error al obtener productividad', error: error.message });
    }
};


// --- GENERATE COMMISSION REPORT ---
exports.generateCommissionReport = async (req, res) => {
    try {
        const { date } = req.query;
        // ===== INICIO DE LA CORRECCIÓN (Typo 4D0 -> 400) =====
        if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return res.status(400).json({ message: 'Fecha inválida (YYYY-MM-DD).' });
        // ===== FIN DE LA CORRECCIÓN =====
        const commissions = await Commission.findAll({
            where: { createdAt: { [Op.gte]: `${date} 00:00:00`, [Op.lte]: `${date} 23:59:59` } },
            attributes: ['folioNumber', 'amount'], order: [['createdAt', 'ASC']]
        });
        const pdfBuffer = await pdfService.createCommissionReportPdf(commissions, date);
        const fileName = `Reporte_Comisiones_${date}.pdf`;
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);
        res.send(pdfBuffer);
    } catch (error) {
        console.error(`Error reporte comisiones ${req.query.date}:`, error);
        res.status(500).json({ message: 'Error al generar reporte', error: error.message });
    }
};

// --- UPDATE FOLIO STATUS ---
exports.updateFolioStatus = async (req, res) => {
    try {
        const folioId = req.params.id;
        if (isNaN(folioId)) return res.status(400).json({ message: 'ID inválido.' });
        const folio = await Folio.findByPk(folioId);
        if (!folio) return res.status(404).json({ message: 'Folio no encontrado' });
        if (folio.status === 'Cancelado') return res.status(400).json({ message: 'Folio cancelado no se puede modificar.' });

        const { isPrinted, fondantChecked, dataChecked } = req.body;
        const updateData = {};
        if (isPrinted !== undefined) updateData.isPrinted = Boolean(isPrinted);
        if (fondantChecked !== undefined) updateData.fondantChecked = Boolean(fondantChecked);
        if (dataChecked !== undefined) updateData.dataChecked = Boolean(dataChecked);

        if (Object.keys(updateData).length === 0) return res.status(400).json({ message: 'No hay estados para actualizar.' });

        await folio.update(updateData);
        console.log(`Estados actualizados folio ${folio.folioNumber}:`, updateData);
        res.status(200).json({ message: 'Estado del folio actualizado.' });
    } catch (error) {
        console.error(`Error updateFolioStatus ${req.params.id}:`, error);
        res.status(500).json({ message: 'Error al actualizar estado', error: error.message });
    }
};