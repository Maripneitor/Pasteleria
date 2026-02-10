const { sequelize } = require('../models');

async function debug() {
    try {
        console.log('🔌 DEBUG: Authenticating...');
        await sequelize.authenticate();
        console.log('✅ DEBUG: Authenticated.');

        console.log('🛠️ DEBUG: Syncing (alter)...');
        await sequelize.sync({ alter: true });
        console.log('✅ DEBUG: Synced.');
        process.exit(0);
    } catch (err) {
        console.error('❌ DEBUG ERROR:', err);
        // Print detailed error
        if (err.original) console.error('Original Error:', err.original);
        process.exit(1);
    }
}

debug();
