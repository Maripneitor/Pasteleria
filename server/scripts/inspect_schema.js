require('dotenv').config({ path: '../.env' });
const { sequelize } = require('../models');

async function inspectSchema() {
    try {
        await sequelize.authenticate();
        const [results] = await sequelize.query("SHOW COLUMNS FROM users LIKE 'globalRole'");
        console.log('Schema Definition:', results);
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}
inspectSchema();
