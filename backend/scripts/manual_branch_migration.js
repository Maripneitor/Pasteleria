const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const { sequelize } = require('../models');

const migrate = async () => {
    try {
        await sequelize.authenticate();
        console.log('🔌 Connected to DB');

        await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');

        // Check columns
        const [columns] = await sequelize.query("SHOW COLUMNS FROM activation_codes LIKE 'branchId'");
        if (columns.length === 0) {
            console.log('🔧 Adding branchId to activation_codes...');
            await sequelize.query(`
                ALTER TABLE activation_codes 
                ADD COLUMN branchId INTEGER DEFAULT NULL COMMENT 'ID de la sucursal asignada'
                AFTER tenantId;
            `);
            console.log('✅ Column branchId added to activation_codes');
        } else {
            console.log('ℹ️ Column branchId already exists in activation_codes');
        }

        await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
    } catch (e) {
        console.error('❌ Migration Failed:', e);
    }
};

migrate().then(() => process.exit());
