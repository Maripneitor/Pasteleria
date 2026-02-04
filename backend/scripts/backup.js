const mysqldump = require('mysqldump');
const path = require('path');
const fs = require('fs').promises; // Usamos 'promises' para fs

// --- CONFIGURACIÓN ---
const dbConfig = {
    connection: {
        host: 'localhost',
        user: 'root',
        password: '12345678', // La contraseña de tu BD
        database: 'pasteleria_db',
    }
};

// Define la carpeta donde se guardarán los respaldos locales
const BACKUP_DIR = path.join(__dirname, '..', 'RESPALDOS_BD');
// --- FIN DE LA CONFIGURACIÓN ---

async function runBackup() {
    console.log('Iniciando proceso de respaldo local...');
    try {
        // 1. Asegurarse de que la carpeta de respaldos exista
        await fs.mkdir(BACKUP_DIR, { recursive: true });

        // 2. Definir el nombre del archivo de respaldo con la fecha
        const fileName = `backup_${new Date().toISOString().split('T')[0]}.sql`;
        const filePath = path.join(BACKUP_DIR, fileName);

        // 3. Generar el archivo de respaldo de la base de datos
        console.log(`Creando respaldo en: ${filePath}`);
        await mysqldump({ ...dbConfig, dumpToFile: filePath });
        
        console.log('✅ Respaldo de la base de datos creado localmente con éxito.');

    } catch (error) {
        console.error('❌ Ocurrió un error durante el proceso de respaldo:', error);
    }
    console.log('Proceso de respaldo finalizado.');
}

runBackup();
