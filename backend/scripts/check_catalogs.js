const { CakeFlavor, Filling, sequelize } = require('../models');

async function listCatalogs() {
    try {
        await sequelize.authenticate();

        console.log('--- ALL FLAVORS (No Filter) ---');
        const flavors = await CakeFlavor.findAll();
        console.log(`Count: ${flavors.length}`);
        flavors.forEach(f => console.log(JSON.stringify(f.toJSON())));

        console.log('--- ALL FILLINGS (No Filter) ---');
        const fillings = await Filling.findAll();
        console.log(`Count: ${fillings.length}`);
        fillings.forEach(f => console.log(JSON.stringify(f.toJSON())));

        process.exit(0);
    } catch (e) {
        console.error("ERROR:", e);
        process.exit(1);
    }
}

listCatalogs();
