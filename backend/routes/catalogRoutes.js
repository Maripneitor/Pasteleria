const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const controller = require('../controllers/catalogController');

router.use(authMiddleware);

// Flavors
router.get('/flavors', controller.getFlavors);
router.post('/flavors', controller.createFlavor);
router.put('/flavors/:id', controller.updateFlavor);
router.patch('/flavors/:id/active', controller.toggleFlavorActive);

// Fillings
router.get('/fillings', controller.getFillings);
router.post('/fillings', controller.createFilling);
router.put('/fillings/:id', controller.updateFilling);
router.patch('/fillings/:id/active', controller.toggleFillingActive);

// Products
router.get('/products', controller.getProducts);
router.post('/products', controller.createProduct);
router.patch('/products/:id/active', controller.toggleProductActive);

// Decorations
router.get('/decorations', controller.getDecorations);
router.post('/decorations', controller.createDecoration);
router.patch('/decorations/:id/active', controller.toggleDecorationActive);

module.exports = router;
