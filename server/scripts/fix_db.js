const { sequelize } = require('../models');

async function fix() {
    try {
        console.log('🛠️ Reparando esquema de base de datos...');
        await sequelize.sync({ alter: true });
        console.log('✅ Base de datos sincronizada. Los errores 500 deberían desaparecer.');
        process.exit(0);
    } catch (err) {
        console.error('❌ Fallo crítico en sincronización:', err);
        process.exit(1);
    }
}
fix();
