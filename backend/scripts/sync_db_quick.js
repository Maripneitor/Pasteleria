const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const { sequelize } = require('../models');

// Override DB config manually if needed for host execution
if (!process.env.DB_PORT) {
    console.log('Using default DB_PORT (from env or 3306)');
}

async function sync() {
    try {
        console.log('Connecting to DB...');
        await sequelize.authenticate();
        console.log('Syncing models...');
        // Alter: true updates tables if they exist but mismatch. False (safe) only creates.
        // Using alter: false (default for sync()) or explicit
        await sequelize.sync({ alter: false });
        console.log('✅ Database Synced!');
        process.exit(0);
    } catch (e) {
        console.error('❌ Sync failed:', e);
        process.exit(1);
    }
}

sync();
