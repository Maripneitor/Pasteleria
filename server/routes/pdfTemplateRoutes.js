const express = require('express');
const router = express.Router();
const controller = require('../controllers/pdfTemplateController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/', controller.listTemplates);
router.post('/', controller.createTemplate);
router.put('/:id', controller.updateTemplate);
router.delete('/:id', controller.deleteTemplate);

router.get('/:id/preview', controller.previewTemplate);

module.exports = router;
