const CakeFlavor = require('../models/CakeFlavor');
const Filling = require('../models/Filling');

// --- FLAVORS ---
exports.getFlavors = async (req, res) => {
    try {
        const tenantId = req.user?.tenantId || 1;
        const includeInactive = req.query.includeInactive === '1' || req.query.includeInactive === 'true';

        const where = { tenantId };
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
        res.status(500).json({ message: "Error al obtener sabores" });
    }
};

exports.toggleFlavorActive = async (req, res) => {
    try {
        const { id } = req.params;
        const { isActive } = req.body;

        const row = await CakeFlavor.findByPk(id);
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
        const row = await CakeFlavor.findByPk(id);
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
        const tenantId = req.user?.tenantId || 1;
        const includeInactive = req.query.includeInactive === '1' || req.query.includeInactive === 'true';

        const where = { tenantId };
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
        res.status(500).json({ message: "Error al obtener rellenos" });
    }
};

exports.toggleFillingActive = async (req, res) => {
    try {
        const { id } = req.params;
        const { isActive } = req.body;

        const row = await Filling.findByPk(id);
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
        const row = await Filling.findByPk(id);
        if (!row) return res.status(404).json({ message: "No encontrado" });

        await row.update(req.body);
        res.json(row);
    } catch (error) {
        console.error("Error updating filling", error);
        res.status(500).json({ message: "Error actualizando relleno" });
    }
};
