const { Ingredient } = require('../../../models');
const { buildTenantWhere } = require('../../../utils/tenantScope');
const asyncHandler = require('../../core/asyncHandler');

exports.list = asyncHandler(async (req, res) => {
    const tenantFilter = buildTenantWhere(req);
    const where = { isActive: true, ...tenantFilter };
    const rows = await Ingredient.findAll({ where, order: [['name', 'ASC']] });
    res.json(rows);
});

exports.create = asyncHandler(async (req, res) => {
    const tenantId = req.user?.tenantId || 1;
    const row = await Ingredient.create({ ...req.body, tenantId });
    res.status(201).json(row);
});

exports.update = asyncHandler(async (req, res) => {
    const tenantFilter = buildTenantWhere(req);
    const where = { id: req.params.id, ...tenantFilter };

    const row = await Ingredient.findOne({ where });
    if (!row) return res.status(404).json({ message: 'No encontrado' });

    await row.update(req.body);
    res.json(row);
});

exports.remove = asyncHandler(async (req, res) => {
    const tenantFilter = buildTenantWhere(req);
    const where = { id: req.params.id, ...tenantFilter };

    const row = await Ingredient.findOne({ where });
    if (!row) return res.status(404).json({ message: 'No encontrado' });

    await row.update({ isActive: false });
    res.json({ message: 'OK' });
});
