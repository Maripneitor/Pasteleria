const CakeFlavor = require('../../../models/CakeFlavor');
const Filling = require('../../../models/Filling');
const Product = require('../../../models/Product');
const Decoration = require('../../../models/Decoration');
const CakeShape = require('../../../models/CakeShape');
const CakeSize = require('../../../models/CakeSize');

const asyncHandler = require('../../core/asyncHandler');
const { buildTenantWhere } = require('../../../utils/tenantScope');
const NodeCache = require('node-cache');

const catalogCache = new NodeCache({ stdTTL: 1800, checkperiod: 120 });

// --- FLAVORS ---
exports.getFlavors = asyncHandler(async (req, res) => {
    const tenantFilter = buildTenantWhere(req);
    const includeInactive = req.query.includeInactive === '1' || req.query.includeInactive === 'true';

    const cacheKey = `flavors_${JSON.stringify(tenantFilter)}_${includeInactive}`;
    const cachedData = catalogCache.get(cacheKey);
    if (cachedData) return res.json(cachedData);

    const where = { ...tenantFilter };
    if (!includeInactive) where.isActive = true;

    const rows = await CakeFlavor.findAll({ where, order: [['name', 'ASC']] });
    catalogCache.set(cacheKey, rows);
    res.json(rows);
});

// CÓDIGO CORREGIDO
exports.createFlavor = asyncHandler(async (req, res) => {
    const tenantId = req.user?.tenantId || 1;
    const { name, price } = req.body; // <-- Agregamos price aquí
    if (!name) return res.status(400).json({ message: "Nombre requerido" });

    // <-- Pasamos el price a la base de datos
    const newItem = await CakeFlavor.create({ name, price: price || 0, tenantId, isActive: true }); 
    catalogCache.flushAll();
    res.status(201).json(newItem);
});

exports.updateFlavor = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const tenantFilter = buildTenantWhere(req);
    const row = await CakeFlavor.findOne({ where: { id, ...tenantFilter } });
    if (!row) return res.status(404).json({ message: "No encontrado" });

    await row.update(req.body);
    catalogCache.flushAll();
    res.json(row);
});

exports.toggleFlavorActive = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { isActive } = req.body;
    const tenantFilter = buildTenantWhere(req);
    const row = await CakeFlavor.findOne({ where: { id, ...tenantFilter } });
    if (!row) return res.status(404).json({ message: "No encontrado" });

    await row.update({ isActive: Boolean(isActive) });
    catalogCache.flushAll();
    res.json(row);
});

exports.deleteFlavor = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const tenantFilter = buildTenantWhere(req);
    const row = await CakeFlavor.findOne({ where: { id, ...tenantFilter } });
    if (!row) return res.status(404).json({ message: "No encontrado" });

    await row.destroy();
    catalogCache.flushAll();
    res.json({ message: "Eliminado con éxito" });
});

// --- FILLINGS ---
exports.getFillings = asyncHandler(async (req, res) => {
    const tenantFilter = buildTenantWhere(req);
    const includeInactive = req.query.includeInactive === '1' || req.query.includeInactive === 'true';

    const where = { ...tenantFilter };
    if (!includeInactive) where.isActive = true;

    const rows = await Filling.findAll({ where, order: [['name', 'ASC']] });
    res.json(rows);
});

exports.createFilling = asyncHandler(async (req, res) => {
    const tenantId = req.user?.tenantId || 1;
    const { name, price } = req.body; // <-- Agregamos price aquí
    
    if (!name) return res.status(400).json({ message: "Nombre requerido" });

    // <-- Pasamos el price a la base de datos (si no viene, le pone 0 por defecto)
    const newItem = await Filling.create({ name, price: price || 0, tenantId, isActive: true });
    
    res.status(201).json(newItem);
});

exports.updateFilling = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const tenantFilter = buildTenantWhere(req);
    const row = await Filling.findOne({ where: { id, ...tenantFilter } });
    if (!row) return res.status(404).json({ message: "No encontrado" });

    await row.update(req.body);
    res.json(row);
});

exports.toggleFillingActive = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { isActive } = req.body;
    const tenantFilter = buildTenantWhere(req);
    const row = await Filling.findOne({ where: { id, ...tenantFilter } });
    if (!row) return res.status(404).json({ message: "No encontrado" });

    await row.update({ isActive: Boolean(isActive) });
    res.json(row);
});

exports.deleteFilling = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const tenantFilter = buildTenantWhere(req);
    const row = await Filling.findOne({ where: { id, ...tenantFilter } });
    if (!row) return res.status(404).json({ message: "No encontrado" });

    await row.destroy();
    res.json({ message: "Eliminado con éxito" });
});

// --- PRODUCTS ---
exports.getProducts = asyncHandler(async (req, res) => {
    const tenantFilter = buildTenantWhere(req);
    const includeInactive = req.query.includeInactive === '1' || req.query.includeInactive === 'true';

    const where = { ...tenantFilter };
    if (!includeInactive) where.isActive = true;

    const rows = await Product.findAll({ where, order: [['name', 'ASC']] });
    res.json(rows);
});

exports.createProduct = asyncHandler(async (req, res) => {
    const tenantId = req.user?.tenantId || 1;
    const { name, basePrice, description } = req.body;
    if (!name) return res.status(400).json({ message: "Nombre requerido" });

    const newItem = await Product.create({ name, basePrice: basePrice || 0, description, tenantId, isActive: true });
    res.status(201).json(newItem);
});

exports.toggleProductActive = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { isActive } = req.body;
    const tenantFilter = buildTenantWhere(req);
    const row = await Product.findOne({ where: { id, ...tenantFilter } });
    if (!row) return res.status(404).json({ message: "No encontrado" });

    await row.update({ isActive: Boolean(isActive) });
    res.json(row);
});

// --- DECORATIONS ---
exports.getDecorations = asyncHandler(async (req, res) => {
    const tenantFilter = buildTenantWhere(req);
    const includeInactive = req.query.includeInactive === '1' || req.query.includeInactive === 'true';
    const where = { ...tenantFilter };
    if (!includeInactive) where.isActive = true;

    const rows = await Decoration.findAll({ where, order: [['name', 'ASC']] });
    res.json(rows);
});

exports.createDecoration = asyncHandler(async (req, res) => {
    const tenantId = req.user?.tenantId || 1;
    const { name, price } = req.body;
    if (!name) return res.status(400).json({ message: "Nombre requerido" });

    const newItem = await Decoration.create({ name, price: price || 0, tenantId, isActive: true });
    res.status(201).json(newItem);
});

exports.toggleDecorationActive = asyncHandler(async (req, res) => {

    const { id } = req.params;
    const { isActive } = req.body;
    const tenantFilter = buildTenantWhere(req);
    const row = await Decoration.findOne({ where: { id, ...tenantFilter } });
    if (!row) return res.status(404).json({ message: "No encontrado" });

    await row.update({ isActive: Boolean(isActive) });
    res.json(row);
});


// --- SHAPES ---
exports.getShapes = asyncHandler(async (req, res) => {
    const tenantFilter = buildTenantWhere(req);
    const { type, includeInactive } = req.query;
    const where = { ...tenantFilter };
    
    if (type) where.type = type; // MAIN or COMPLEMENTARY
    if (includeInactive !== '1' && includeInactive !== 'true') where.isActive = true;

    const rows = await CakeShape.findAll({ where, order: [['name', 'ASC']] });
    res.json(rows);
});

exports.createShape = asyncHandler(async (req, res) => {
    const tenantId = req.user?.tenantId || 1;
    const { name, price, type } = req.body;
    if (!name || (type !== 'MAIN' && type !== 'COMPLEMENTARY')) {
        return res.status(400).json({ message: "Nombre y tipo (MAIN/COMPLEMENTARY) requeridos" });
    }

    const newItem = await CakeShape.create({ name, price: price || 0, type, tenantId, isActive: true });
    res.status(201).json(newItem);
});

exports.updateShape = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const tenantFilter = buildTenantWhere(req);
    const row = await CakeShape.findOne({ where: { id, ...tenantFilter } });
    if (!row) return res.status(404).json({ message: "No encontrado" });

    await row.update(req.body);
    res.json(row);
});

exports.toggleShapeActive = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { isActive } = req.body;
    const tenantFilter = buildTenantWhere(req);
    const row = await CakeShape.findOne({ where: { id, ...tenantFilter } });
    if (!row) return res.status(404).json({ message: "No encontrado" });

    await row.update({ isActive: Boolean(isActive) });
    res.json(row);
});

exports.deleteShape = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const tenantFilter = buildTenantWhere(req);
    const row = await CakeShape.findOne({ where: { id, ...tenantFilter } });
    if (!row) return res.status(404).json({ message: "No encontrado" });

    await row.destroy();
    res.json({ message: "Eliminado con éxito" });
});

// --- SIZES ---
exports.getSizes = asyncHandler(async (req, res) => {
    const tenantFilter = buildTenantWhere(req);
    const { type, includeInactive } = req.query;
    const where = { ...tenantFilter };
    
    if (type) where.type = type; // MAIN or COMPLEMENTARY
    if (includeInactive !== '1' && includeInactive !== 'true') where.isActive = true;

    const rows = await CakeSize.findAll({ where, order: [['name', 'ASC']] });
    res.json(rows);
});

exports.createSize = asyncHandler(async (req, res) => {
    const tenantId = req.user?.tenantId || 1;
    const { name, price, type } = req.body;
    if (!name || (type !== 'MAIN' && type !== 'COMPLEMENTARY')) {
        return res.status(400).json({ message: "Nombre y tipo (MAIN/COMPLEMENTARY) requeridos" });
    }

    const newItem = await CakeSize.create({ name, price: price || 0, type, tenantId, isActive: true });
    res.status(201).json(newItem);
});

exports.updateSize = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const tenantFilter = buildTenantWhere(req);
    const row = await CakeSize.findOne({ where: { id, ...tenantFilter } });
    if (!row) return res.status(404).json({ message: "No encontrado" });

    await row.update(req.body);
    res.json(row);
});

exports.toggleSizeActive = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { isActive } = req.body;
    const tenantFilter = buildTenantWhere(req);
    const row = await CakeSize.findOne({ where: { id, ...tenantFilter } });
    if (!row) return res.status(404).json({ message: "No encontrado" });

    await row.update({ isActive: Boolean(isActive) });
    res.json(row);
});

exports.deleteSize = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const tenantFilter = buildTenantWhere(req);
    const row = await CakeSize.findOne({ where: { id, ...tenantFilter } });
    if (!row) return res.status(404).json({ message: "No encontrado" });

    await row.destroy();
    res.json({ message: "Eliminado con éxito" });
});
