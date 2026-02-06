const express = require('express');
const router = express.Router();
const aiOrderController = require('../controllers/aiOrderController');
const authMiddleware = require('../middleware/authMiddleware');
const tenantScope = require('../middleware/tenantScope');

router.use(authMiddleware);
router.use(tenantScope);

router.post('/parse', aiOrderController.parseOrder);

module.exports = router;
