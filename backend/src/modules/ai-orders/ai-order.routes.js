const express = require('express');
const router = express.Router();
const aiOrderController = require('./ai-order.controller');
const authMiddleware = require('../../../middleware/authMiddleware');
const tenantScope = require('../../../middleware/tenantScope');

// Middlewares globales de esta ruta
router.use(authMiddleware);
router.use(tenantScope);

// Mapeo de rutas a sus controladores
router.post('/parse', aiOrderController.parseOrder);
router.post('/create', aiOrderController.createOrder);
router.post('/edit', aiOrderController.editOrder);
router.post('/search', aiOrderController.searchOrders);
router.post('/insights', aiOrderController.getInsights);

module.exports = router;