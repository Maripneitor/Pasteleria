const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 1. Definir la ruta donde se guardarán (carpeta 'uploads' en la raíz del backend)
const uploadPath = path.join(__dirname, '../uploads');

// 2. Crear la carpeta automáticamente si no existe para evitar errores
if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
}

// 3. Configurar el almacenamiento en disco (Disk Storage)
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadPath); // Dónde se guardan
    },
    filename: function (req, file, cb) {
        // Generar un nombre único para que no se sobrescriban si 2 imágenes se llaman igual
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const extension = path.extname(file.originalname);
        cb(null, 'ref-' + uniqueSuffix + extension); // Ej. ref-1678901234-123456.jpg
    }
});

// 4. Crear el middleware con los límites
const uploadReference = multer({
    storage: storage, // ✅ Usamos el storage físico en lugar del memoryStorage
    limits: {
        files: 5,
        fileSize: 6 * 1024 * 1024, // 6MB cada una
    },
});

module.exports = uploadReference;