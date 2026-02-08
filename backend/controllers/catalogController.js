const CakeFlavor = require('../models/CakeFlavor');
const Filling = require('../models/Filling');
const Product = require('../models/Product');
const Decoration = require('../models/Decoration');

const fs = require('fs');

const { buildTenantWhere } = require('../utils/tenantScope');

// --- FLAVORS ---
exports.getFlavors = async (req, res) => {
    try {
        const tenantFilter = buildTenantWhere(req);
        const includeInactive = req.query.includeInactive === '1' || req.query.includeInactive === 'true';

        const where = { ...tenantFilter };
        if (!includeInactive) {
            where.isActive = true;
        }

        const rows = await CakeFlavor.findAll({
            where,
            order: [['name', 'ASC']],
        });
        res.json(rows);
    } catch (error) {
        console.error("Error fetching flavors", error);
        fs.appendFileSync('error.log', `[Flavor] Error: ${error.stack}\n`);
        res.status(500).json({ message: "Error al obtener sabores" });
    }
};

exports.toggleFlavorActive = async (req, res) => {
    try {
        const { id } = req.params;
        const { isActive } = req.body;

        const tenantFilter = buildTenantWhere(req);
        const row = await CakeFlavor.findOne({ where: { id, ...tenantFilter } });
        if (!row) return res.status(404).json({ message: "No encontrado" });

        await row.update({ isActive: Boolean(isActive) });
        res.json(row);
    } catch (error) {
        console.error("Error toggling flavor", error);
        res.status(500).json({ message: "Error actualizando estado de sabor" });
    }
};

exports.createFlavor = async (req, res) => {
    try {
        const tenantId = req.user?.tenantId || 1;
        const { name } = req.body;
        if (!name) return res.status(400).json({ message: "Nombre requerido" });

        const newItem = await CakeFlavor.create({ name, tenantId, isActive: true });
        res.status(201).json(newItem);
    } catch (error) {
        console.error("Error creating flavor", error);
        res.status(500).json({ message: "Error creando sabor" });
    }
};

exports.updateFlavor = async (req, res) => {
    try {
        const { id } = req.params;
        const tenantFilter = buildTenantWhere(req);
        const row = await CakeFlavor.findOne({ where: { id, ...tenantFilter } });
        if (!row) return res.status(404).json({ message: "No encontrado" });

        await row.update(req.body); // update name, isActive, etc.
        res.json(row);
    } catch (error) {
        console.error("Error updating flavor", error);
        res.status(500).json({ message: "Error interno al actualizar", error: error.message });
    }
};

// --- FILLINGS ---
exports.getFillings = async (req, res) => {
    try {
        const tenantFilter = buildTenantWhere(req);
        const includeInactive = req.query.includeInactive === '1' || req.query.includeInactive === 'true';

        const where = { ...tenantFilter };
        if (!includeInactive) {
            where.isActive = true;
        }

        const rows = await Filling.findAll({
            where,
            order: [['name', 'ASC']],
        });
        res.json(rows);
    } catch (error) {
        console.error("Error fetching fillings", error);
        fs.appendFileSync('error.log', `[Filling] Error: ${error.stack}\n`);
        res.status(500).json({ message: "Error al obtener rellenos" });
    }
};

exports.toggleFillingActive = async (req, res) => {
    try {
        const { id } = req.params;
        const { isActive } = req.body;

        const tenantFilter = buildTenantWhere(req);
        const row = await Filling.findOne({ where: { id, ...tenantFilter } });
        if (!row) return res.status(404).json({ message: "No encontrado" });

        await row.update({ isActive: Boolean(isActive) });
        res.json(row);
    } catch (error) {
        console.error("Error toggling filling", error);
        res.status(500).json({ message: "Error actualizando estado de relleno" });
    }
};

exports.createFilling = async (req, res) => {
    try {
        const tenantId = req.user?.tenantId || 1;
        const { name } = req.body;
        if (!name) return res.status(400).json({ message: "Nombre requerido" });

        const newItem = await Filling.create({ name, tenantId, isActive: true });
        res.status(201).json(newItem);
    } catch (error) {
        console.error("Error creating filling", error);
        res.status(500).json({ message: "Error creando relleno" });
    }
};

exports.updateFilling = async (req, res) => {
    try {
        const { id } = req.params;
        const tenantFilter = buildTenantWhere(req);
        const row = await Filling.findOne({ where: { id, ...tenantFilter } });
        if (!row) return res.status(404).json({ message: "No encontrado" });

        await row.update(req.body);
        res.json(row);
    } catch (error) {
        console.error("Error updating filling", error);
        res.status(500).json({ message: "Error actualizando relleno" });
    }
};

// --- PRODUCTS (Cakes/Bases) ---
exports.getProducts = async (req, res) => {
    try {
        // fs.appendFileSync('trace.log', `[${req.method} ${req.originalUrl}] Entered getProducts\n`);
        const tenantFilter = buildTenantWhere(req);
        const includeInactive = req.query.includeInactive === '1' || req.query.includeInactive === 'true';

        const where = { ...tenantFilter };
        if (!includeInactive) {
            where.isActive = true;
        }

        const rows = await Product.findAll({
            where,
            order: [['name', 'ASC']],
        });
        res.json(rows);
    } catch (error) {
        console.error("Error fetching products", error);
        // fs.appendFileSync('error.log', `[Product] Error: ${error.stack}\n`);
        res.status(500).json({ message: "Error al obtener productos: " + error.message, stack: error.stack });
    }
};

exports.createProduct = async (req, res) => {
    try {
        const tenantId = req.user?.tenantId || 1;
        const { name, basePrice, description } = req.body;
        if (!name) return res.status(400).json({ message: "Nombre requerido" });

        const newItem = await Product.create({
            name,
            basePrice: basePrice || 0,
            description,
            tenantId,
            isActive: true
        });
        res.status(201).json(newItem);
    } catch (error) {
        console.error("Error creating product", error);
        fs.appendFileSync('error.log', `[CreateProduct] Error: ${error.stack}\n`);
        res.status(500).json({ message: "Error creando producto" });
    }
};

exports.toggleProductActive = async (req, res) => {
    try {
        const { id } = req.params;
        const { isActive } = req.body;
        const tenantFilter = buildTenantWhere(req);
        const row = await Product.findOne({ where: { id, ...tenantFilter } });
        if (!row) return res.status(404).json({ message: "No encontrado" });

        await row.update({ isActive: Boolean(isActive) });
        res.json(row);
    } catch (error) {
        res.status(500).json({ message: "Error actualizando estado" });
    }
};

// --- DECORATIONS (Extras) ---
exports.getDecorations = async (req, res) => {
    try {
        const tenantFilter = buildTenantWhere(req);
        const includeInactive = req.query.includeInactive === '1' || req.query.includeInactive === 'true';

        const where = { ...tenantFilter };
        if (!includeInactive) {
            where.isActive = true;
        }

        const rows = await Decoration.findAll({
            where,
            order: [['name', 'ASC']],
        });
        res.json(rows);
    } catch (error) {
        console.error("Error fetching decorations", error);
        fs.appendFileSync('error.log', `[Decoration] Error: ${error.stack}\n`);
        res.status(500).json({ message: "Error al obtener decoraciones" });
    }
};

exports.createDecoration = async (req, res) => {
    try {
        const tenantId = req.user?.tenantId || 1;
        const { name, price } = req.body;
        if (!name) return res.status(400).json({ message: "Nombre requerido" });

        const newItem = await Decoration.create({
            name,
            price: price || 0,
            tenantId,
            isActive: true
        });
        res.status(201).json(newItem);
    } catch (error) {
        console.error("Error creating decoration", error);
        fs.appendFileSync('error.log', `[CreateDecoration] Error: ${error.stack}\n`);
        res.status(500).json({ message: "Error creando decoración" });
    }
};

exports.toggleDecorationActive = async (req, res) => {
    try {
        const { id } = req.params;
        const { isActive } = req.body;
        const tenantFilter = buildTenantWhere(req);
        const row = await Decoration.findOne({ where: { id, ...tenantFilter } });
        if (!row) return res.status(404).json({ message: "No encontrado" });

        await row.update({ isActive: Boolean(isActive) });
        res.json(row);
    } catch (error) {
        res.status(500).json({ message: "Error actualizando estado" });
    }
};
