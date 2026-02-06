const orderFlowService = require('../services/orderFlowService');

exports.createDraft = async (req, res) => {
    try {
        const folio = await orderFlowService.createDraft(req.body, req.user);
        res.status(201).json(folio);
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Error creating draft', error: e.message });
    }
};

exports.confirmOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const folio = await orderFlowService.confirmOrder(id, req.user);
        res.json({ message: 'Order Confirmed', folio });
    } catch (e) {
        console.error(e);
        const status = e.message.includes('not found') ? 404 : 400;
        res.status(status).json({ message: e.message });
    }
};

exports.updateStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const folio = await orderFlowService.transitionStatus(id, status, req.user);
        res.json({ message: `Transitioned to ${status}`, folio });
    } catch (e) {
        console.error(e);
        const status = e.message.includes('not found') ? 404 : 400;
        res.status(status).json({ message: e.message });
    }
};
