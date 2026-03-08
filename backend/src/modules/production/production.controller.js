const { Op } = require('sequelize');
const Folio = require('../../../models/Folio');
const { buildTenantWhere } = require('../../../utils/tenantScope');
const asyncHandler = require('../../core/asyncHandler');

// GET /api/v1/production?date=YYYY-MM-DD
exports.getDailyProduction = asyncHandler(async (req, res) => {
    const { date } = req.query;
    if (!date) return res.status(400).json({ message: 'Fecha requerida (date=YYYY-MM-DD)' });

    const tenantFilter = buildTenantWhere(req);

    const folios = await Folio.findAll({
        where: {
            fecha_entrega: date,
            estatus_folio: { [Op.ne]: 'Cancelado' },
            ...tenantFilter
        },
        order: [['hora_entrega', 'ASC']]
    });

    res.json(folios);
});

// PATCH /api/v1/production/:id/status
exports.updateStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body; // 'Pendiente', 'En Horno', 'Decoración', 'Listo'

    const tenantFilter = buildTenantWhere(req);
    const folio = await Folio.findOne({
        where: { id: id, ...tenantFilter }
    });

    if (!folio) return res.status(404).json({ message: 'No encontrado' });

    await folio.update({ estatus_produccion: status });
    res.json(folio);
});
