const { Ingredient } = require('../models');

exports.list = async (req, res) => {
    const tenantId = req.user?.tenantId || 1;
    const where = { isActive: true };
    if (tenantId) where.tenantId = tenantId;
    const rows = await Ingredient.findAll({ where, order: [['name', 'ASC']] });
    res.json(rows);
};

exports.create = async (req, res) => {
    const tenantId = req.user?.tenantId || 1;
    const row = await Ingredient.create({ ...req.body, tenantId });
    res.status(201).json(row);
};

exports.update = async (req, res) => {
    const tenantId = req.user?.tenantId || 1;
    const where = { id: req.params.id };
    if (tenantId) where.tenantId = tenantId;
    const row = await Ingredient.findOne({ where });
    if (!row) return res.status(404).json({ message: 'No encontrado' });
    await row.update(req.body);
    res.json(row);
};

exports.remove = async (req, res) => {
    const tenantId = req.user?.tenantId || 1;
    const where = { id: req.params.id };
    if (tenantId) where.tenantId = tenantId;
    const row = await Ingredient.findOne({ where });
    if (!row) return res.status(404).json({ message: 'No encontrado' });
    await row.update({ isActive: false });
    res.json({ message: 'OK' });
};
