const express = require('express');
const router = express.Router();
const multer = require('multer');
const dictationController = require('../controllers/dictationController');
const authMiddleware = require('../middleware/authMiddleware');

// Configuración de Multer para guardar en memoria (más simple para este caso)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Aplicar autenticación
router.use(authMiddleware);

// Ruta para procesar el audio
router.post('/process', upload.single('audio'), dictationController.processDictation);

module.exports = router;