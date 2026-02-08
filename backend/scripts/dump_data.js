const { sequelize, Product, Folio } = require('../models');

async function dumpData() {
    try {
        await sequelize.authenticate();

        console.log('--- PRODUCTS ---');
        const products = await Product.findAll();
        console.log(JSON.stringify(products, null, 2));

        console.log('--- FOLIOS ---');
        const folios = await Folio.findAll();
        console.log(JSON.stringify(folios, null, 2));

        process.exit(0);
    } catch (error) {
        console.error('Error dumping data:', error);
        process.exit(1);
    }
}

dumpData();
