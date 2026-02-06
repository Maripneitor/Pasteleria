require('dotenv').config({ path: '../../.env' });
const { sequelize } = require('../../config/database');

const migrate = async () => {
    console.log('🚀 Starting Migration: Unify Branch IDs to BIGINT...');

    try {
        await sequelize.authenticate();
        console.log('🔌 Connected to DB');

        // Disable Foreign Key Checks to allow modifying columns involved in relations
        await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');

        // 1. Modify branches.id
        // Note: preserving AUTO_INCREMENT
        try {
            await sequelize.query('ALTER TABLE branches MODIFY COLUMN id BIGINT AUTO_INCREMENT');
            console.log('✅ branches.id converted to BIGINT AUTO_INCREMENT');
        } catch (error) {
            console.error('⚠️ Error modifying branches.id:', error.original ? error.original.message : error.message);
        }

        // 2. Modify users.branchId
        try {
            await sequelize.query('ALTER TABLE users MODIFY COLUMN branchId BIGINT NULL');
            console.log('✅ users.branchId converted to BIGINT');
        } catch (error) {
            console.error('⚠️ Error modifying users.branchId:', error.original ? error.original.message : error.message);
        }

        // 3. Modify activation_codes.branchId
        try {
            await sequelize.query('ALTER TABLE activation_codes MODIFY COLUMN branchId BIGINT NULL');
            console.log('✅ activation_codes.branchId converted to BIGINT');
        } catch (error) {
            console.error('⚠️ Error modifying activation_codes.branchId:', error.original ? error.original.message : error.message);
        }

        // Re-enable Foreign Key Checks
        await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');

        console.log('🏁 Migration Complete.');

    } catch (error) {
        console.error('❌ Critical Migration Failure:', error);
    } finally {
        await sequelize.close();
    }
};

if (require.main === module) {
    migrate();
}

module.exports = migrate;
