const { Op } = require('sequelize');
const Folio = require('../models/Folio');

const { buildTenantWhere } = require('../utils/tenantScope');

// GET /api/production?date=YYYY-MM-DD&status=Status&branchId=ID
exports.getDailyProduction = async (req, res) => {
    try {
        const { date, status } = req.query;
        if (!date) return res.status(400).json({ message: 'Fecha requerida (date=YYYY-MM-DD)' });

        const { buildTenantWhere, buildBranchWhere } = require('../utils/tenantScope');
        const tenantFilter = buildTenantWhere(req);
        const branchFilter = buildBranchWhere(req);

        const where = {
            fecha_entrega: date,
            estatus_folio: { [Op.ne]: 'Cancelado' },
            ...tenantFilter,
            ...branchFilter
        };

        if (status) {
            where.estatus_produccion = status;
        }

        const folios = await Folio.findAll({
            where,
            order: [['hora_entrega', 'ASC']]
        });

        res.json(folios);
    } catch (e) {
        console.error("Prod error:", e);
        res.status(500).json({ message: 'Error fetching production' });
    }
};

// PATCH /api/production/:id/status
exports.updateStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // 'Pendiente', 'En Horno', 'Decoración', 'Listo'

        const tenantFilter = buildTenantWhere(req);
        const folio = await Folio.findOne({
            where: { id: id, ...tenantFilter }
        });

        if (!folio) return res.status(404).json({ message: 'No encontrado' });

        await folio.update({ estatus_produccion: status });
        res.json(folio);
    } catch (e) {
        console.error("Status update error:", e);
        res.status(500).json({ message: 'Error updating status' });
    }
};
