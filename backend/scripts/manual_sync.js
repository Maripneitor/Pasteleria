const { sequelize } = require('../models');

async function sync() {
    try {
        console.log('Authenticating...');
        await sequelize.authenticate();
        console.log('Connected. Syncing...');
        await sequelize.sync({ alter: true });
        console.log('Sync complete.');
        process.exit(0);
    } catch (error) {
        console.error('Sync failed:', error);
        process.exit(1);
    }
}

sync();
