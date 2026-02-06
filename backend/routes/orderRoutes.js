const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const authMiddleware = require('../middleware/authMiddleware');
const tenantScope = require('../middleware/tenantScope');

// Protection
router.use(authMiddleware);
router.use(tenantScope);

router.post('/', orderController.createDraft);
router.post('/:id/confirm', orderController.confirmOrder);
router.post('/:id/status', orderController.updateStatus);

module.exports = router;
