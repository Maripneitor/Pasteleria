const { sequelize } = require('../models');

async function checkIndices() {
    try {
        await sequelize.authenticate();
        const [results] = await sequelize.query("SHOW INDEX FROM folios");
        console.log(JSON.stringify(results, null, 2));
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

checkIndices();
