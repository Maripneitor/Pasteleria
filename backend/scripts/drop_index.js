const { sequelize } = require('../models');

async function dropIndex() {
    try {
        await sequelize.authenticate();
        console.log('Dropping index...');
        await sequelize.query("DROP INDEX uq_folios_tenant_folioNumber ON folios");
        console.log('Index dropped.');
        process.exit(0);
    } catch (error) {
        console.error('Error dropping index (might not exist):', error.message);
        // Ensure we exit 0 even if it fails (e.g. doesn't exist) to allow next steps
        process.exit(0);
    }
}

dropIndex();
