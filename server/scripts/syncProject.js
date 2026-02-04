const { sequelize } = require('../models');

const syncProject = async () => {
    try {
        console.log('🔄 Iniciando sincronización de base de datos...');
        await sequelize.sync({ alter: true });
        console.log('✅ Tablas actualizadas (Complementos y Logística añadidos).');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error en sincronización:', error);
        process.exit(1);
    }
};

syncProject();
