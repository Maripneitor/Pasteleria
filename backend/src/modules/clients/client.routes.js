const express = require('express');
const router = express.Router();
const clientController = require('./client.controller');
const authMiddleware = require('../../../middleware/authMiddleware');
const validateRequest = require('../../../middleware/validate');
const { createClientSchema } = require('../../../schemas/folioSchema');

router.use(authMiddleware);

// Define las rutas para la colección de clientes
router.get('/', clientController.getAllClients);
router.post('/', validateRequest(createClientSchema), clientController.createClient);

module.exports = router;