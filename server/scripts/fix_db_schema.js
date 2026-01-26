require('dotenv').config({ path: '../.env' }); // Load root .env
const { sequelize } = require('../models');

async function fixSchema() {
    try {
        console.log('🔌 Conectando a la BD...');
        await sequelize.authenticate();
        console.log('✅ Conectado.');

        const queryInterface = sequelize.getQueryInterface();

        const missingColumns = [
            { name: 'shape', type: 'VARCHAR(255) NULL' },
            { name: 'tiers', type: 'JSON NULL' },
            { name: 'accessories', type: 'TEXT NULL' },
            { name: 'additional', type: 'JSON NULL' },
            { name: 'complements', type: 'JSON NULL' },
            { name: 'hasExtraHeight', type: 'TINYINT(1) DEFAULT 0' },
            { name: 'isPrinted', type: 'TINYINT(1) DEFAULT 0' },
            { name: 'fondantChecked', type: 'TINYINT(1) DEFAULT 0' },
            { name: 'dataChecked', type: 'TINYINT(1) DEFAULT 0' },
            { name: 'imageUrls', type: 'JSON NULL' },
            { name: 'imageComments', type: 'JSON NULL' },
            { name: 'cakeFlavor', type: 'JSON NULL' },
            { name: 'filling', type: 'JSON NULL' },
            { name: 'deliveryCost', type: 'DECIMAL(10, 2) DEFAULT 0.00' },
            { name: 'advancePayment', type: 'DECIMAL(10, 2) DEFAULT 0.00' },
            { name: 'balance', type: 'DECIMAL(10, 2) DEFAULT 0.00' },
            { name: 'isPaid', type: 'TINYINT(1) DEFAULT 0' }
        ];

        for (const col of missingColumns) {
            try {
                console.log(`🛠 Agregando columna: ${col.name}...`);
                await sequelize.query(`ALTER TABLE folios ADD COLUMN ${col.name} ${col.type};`);
                console.log(`✅ ${col.name} agregada.`);
            } catch (error) {
                if (error.original && error.original.code === 'ER_DUP_FIELDNAME') {
                    console.log(`ℹ️ La columna ${col.name} ya existe.`);
                } else {
                    console.error(`❌ Error agregando ${col.name}:`, error.message);
                }
            }
        }

        console.log('🏁 Schema Fix completado.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error fatal:', error);
        process.exit(1);
    }
}

fixSchema();
