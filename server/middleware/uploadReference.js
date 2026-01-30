const multer = require('multer');

const uploadReference = multer({
    storage: multer.memoryStorage(),
    limits: {
        files: 5,
        fileSize: 6 * 1024 * 1024, // 6MB cada una
    },
});

module.exports = uploadReference;
