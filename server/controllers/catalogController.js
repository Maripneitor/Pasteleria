const CakeFlavor = require('../models/CakeFlavor');
const Filling = require('../models/Filling');

exports.getFlavors = async (req, res) => {
    try {
        const tenantId = req.user?.tenantId || 1;
        const rows = await CakeFlavor.findAll({
            where: { tenantId, isActive: true },
            order: [['name', 'ASC']],
        });
        res.json(rows);
    } catch (error) {
        console.error("Error fetching flavors", error);
        res.status(500).json({ message: "Error al obtener sabores" });
    }
};

exports.getFillings = async (req, res) => {
    try {
        const tenantId = req.user?.tenantId || 1;
        const rows = await Filling.findAll({
            where: { tenantId, isActive: true },
            order: [['name', 'ASC']],
        });
        res.json(rows);
    } catch (error) {
        console.error("Error fetching fillings", error);
        res.status(500).json({ message: "Error al obtener rellenos" });
    }
};
