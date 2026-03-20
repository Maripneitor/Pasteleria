const express = require('express');
const router = express.Router();
const authMiddleware = require('../../../middleware/authMiddleware');
const catalogController = require('./catalog.controller');
const ingredientController = require('./ingredient.controller');

router.use(authMiddleware);

// --- FLAVORS ---
router.get('/flavors', catalogController.getFlavors);
router.post('/flavors', catalogController.createFlavor);
router.put('/flavors/:id', catalogController.updateFlavor);
router.patch('/flavors/:id/active', catalogController.toggleFlavorActive);

// --- FILLINGS ---
router.get('/fillings', catalogController.getFillings);
router.post('/fillings', catalogController.createFilling);
router.put('/fillings/:id', catalogController.updateFilling);
router.patch('/fillings/:id/active', catalogController.toggleFillingActive);

// --- PRODUCTS ---
router.get('/products', catalogController.getProducts);
router.post('/products', catalogController.createProduct);
router.patch('/products/:id/active', catalogController.toggleProductActive);

// --- DECORATIONS ---
router.get('/decorations', catalogController.getDecorations);
router.post('/decorations', catalogController.createDecoration);
router.patch('/decorations/:id/active', catalogController.toggleDecorationActive);

// --- INGREDIENTS ---
router.get('/ingredients', ingredientController.list);
router.post('/ingredients', ingredientController.create);
router.put('/ingredients/:id', ingredientController.update);
router.delete('/ingredients/:id', ingredientController.remove);

// --- SHAPES ---
router.get('/shapes', catalogController.getShapes);
router.post('/shapes', catalogController.createShape);
router.put('/shapes/:id', catalogController.updateShape);
router.patch('/shapes/:id/active', catalogController.toggleShapeActive);

module.exports = router;
