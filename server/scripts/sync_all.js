const { sequelize } = require('../models');

async function repair() {
    try {
        console.log('🛠️ Iniciando sincronización local...');
        await sequelize.sync({ alter: true });
        console.log('✅ Base de datos actualizada con Complementos y Logística.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error en sincronización:', error);
        process.exit(1);
    }
}
repair();
