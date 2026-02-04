const { Op } = require('sequelize');
const Folio = require('../models/Folio');

// GET /api/production?date=YYYY-MM-DD
exports.getDailyProduction = async (req, res) => {
    try {
        const { date } = req.query;
        if (!date) return res.status(400).json({ message: 'Fecha requerida (date=YYYY-MM-DD)' });

        const folios = await Folio.findAll({
            where: {
                fecha_entrega: date,
                estatus_folio: { [Op.ne]: 'Cancelado' }
            },
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

        const folio = await Folio.findByPk(id);
        if (!folio) return res.status(404).json({ message: 'No encontrado' });

        await folio.update({ estatus_produccion: status });
        res.json(folio);
    } catch (e) {
        console.error("Status update error:", e);
        res.status(500).json({ message: 'Error updating status' });
    }
};
