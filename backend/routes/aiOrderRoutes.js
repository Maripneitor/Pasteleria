const express = require('express');
const router = express.Router();
const aiOrderController = require('../controllers/aiOrderController');
const authMiddleware = require('../middleware/authMiddleware');
const tenantScope = require('../middleware/tenantScope');

router.use(authMiddleware);
router.use(tenantScope);

// Ruta existente
router.post('/parse', aiOrderController.parseOrder);

// ===== NUEVAS RUTAS AI =====
// Crear pedido completo con IA
router.post('/create', aiOrderController.createOrderWithAI);

// Editar pedido con instrucciones en lenguaje natural
router.post('/edit', aiOrderController.editOrderWithAI);

// Buscar pedidos con consultas en lenguaje natural
router.post('/search', aiOrderController.searchOrdersWithAI);

// Obtener insights del dashboard
router.post('/insights', aiOrderController.getDashboardInsights);

module.exports = router;
