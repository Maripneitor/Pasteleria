const express = require('express');
const router = express.Router();
const whatsappController = require('../controllers/whatsappController');

// Ruta POST en /api/webhooks/whatsapp
// Whaticket enviará sus notificaciones a esta URL.
router.post('/whatsapp', whatsappController.handleWebhook);

// Whaticket también puede requerir una validación inicial con una petición GET.
router.get('/whatsapp', (req, res) => {
    console.log("Recibida petición GET de validación de webhook.");
    res.status(200).send(req.query['hub.challenge'] || 'Webhook listo.');
});

module.exports = router;
