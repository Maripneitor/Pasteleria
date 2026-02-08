const { sequelize, Product } = require('../models');

async function simulateGet() {
    try {
        await sequelize.authenticate();

        console.log('Simulating GET /products...');
        const products = await Product.findAll({
            where: { tenantId: 1 },
            order: [['name', 'ASC']]
        });
        console.log('Success:', JSON.stringify(products, null, 2));

        process.exit(0);
    } catch (error) {
        console.error('Simulation Failed:', error);
        process.exit(1);
    }
}

simulateGet();
