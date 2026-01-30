require('dotenv').config({ path: '../.env' });
const { sequelize } = require('../models');

async function fixEnum() {
    console.log('🛠 Fixing globalRole ENUM...');
    try {
        await sequelize.authenticate();
        // Modify column to include new roles. Note: This query is MySQL specific.
        await sequelize.query("ALTER TABLE users MODIFY COLUMN globalRole ENUM('ADMIN', 'USER', 'Administrador', 'Usuario') NOT NULL DEFAULT 'Usuario';");
        console.log('✅ ENUM updated.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error updating ENUM:', error);
        process.exit(1);
    }
}
fixEnum();
