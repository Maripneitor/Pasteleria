const { sequelize } = require('../models');

async function checkIndex() {
    try {
        await sequelize.authenticate();
        const [results] = await sequelize.query(
            "SELECT * FROM information_schema.STATISTICS WHERE TABLE_NAME = 'folios' AND INDEX_NAME = 'uq_folios_tenant_folioNumber'"
        );
        console.log(JSON.stringify(results, null, 2));
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

checkIndex();
