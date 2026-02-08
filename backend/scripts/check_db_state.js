const { sequelize, Product, Folio } = require('../models');

async function check() {
    try {
        await sequelize.authenticate();

        const productCount = await Product.count();
        console.log(`Product Count: ${productCount}`);
        const products = await Product.findAll();
        console.log('Products:', JSON.stringify(products, null, 2));

        const conflictFolio = await Folio.findOne({ where: { folio_numero: '1' } });
        console.log('Conflict Folio (folio_numero=1):', conflictFolio ? JSON.stringify(conflictFolio, null, 2) : 'None');

        const conflictTenant = await Folio.findOne({ where: { tenantId: 1, folio_numero: '1' } });
        console.log('Conflict Folio (tenant=1, folio=1):', conflictTenant ? JSON.stringify(conflictTenant, null, 2) : 'None');

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

check();
