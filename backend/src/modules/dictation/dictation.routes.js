const express = require('express');
const router = express.Router();
const multer = require('multer');
const dictationController = require('./dictation.controller');
const authMiddleware = require('../../../middleware/authMiddleware');

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.use(authMiddleware);

router.post('/process', upload.single('audio'), dictationController.processDictation);

module.exports = router;
