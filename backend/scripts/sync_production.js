const { sequelize } = require('../models');

async function syncLocal() {
    try {
        console.log('🔄 Sincronizando Base de Datos Local...');
        // alter: true agrega columnas nuevas sin borrar tus datos actuales
        await sequelize.sync({ alter: true });
        console.log('✅ Tablas actualizadas. Columnas de Logística y Complementos listas.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error sincronizando:', error);
        process.exit(1);
    }
}
syncLocal();
