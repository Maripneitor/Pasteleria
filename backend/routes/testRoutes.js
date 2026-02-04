const express = require('express');
const router = express.Router();
const whatsappController = require('../controllers/whatsappController');

/**
 * RUTA DE PRUEBA: POST /api/test/webhook
 * Simula la llegada de un webhook desde Whaticket.
 * Acepta un JSON con una clave "conversation" que contiene el texto del chat.
 */
router.post('/webhook', (req, res) => {
    console.log('🧪 Recibida petición en la ruta de prueba del webhook.');

    const { conversation } = req.body;

    if (!conversation) {
        return res.status(400).json({ message: 'El cuerpo de la petición debe incluir una clave "conversation".' });
    }

    // 1. Construimos un objeto `req` falso que imita la estructura que espera el whatsappController.
    const mockReq = {
        body: {
            data: {
                body: 'Este es un mensaje de prueba con el comando /crearfolio',
                conversation: conversation,
            }
        }
    };

    // 2. Llamamos directamente a la función del controlador del webhook con los datos simulados.
    whatsappController.handleWebhook(mockReq, res);
});

module.exports = router;
