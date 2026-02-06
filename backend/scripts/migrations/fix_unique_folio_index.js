require('dotenv').config({ path: '../../.env' });
const { sequelize } = require('../../config/database');

const migrate = async () => {
    console.log('🚀 Fixing Broken Unique Index on Folios...');

    try {
        await sequelize.authenticate();

        // 1. Drop bad index
        try {
            await sequelize.query('ALTER TABLE folios DROP INDEX uq_folios_tenant_folioNumber');
            console.log('✅ Dropped bad index uq_folios_tenant_folioNumber');
        } catch (e) {
            console.log('ℹ️ Index drop failed (maybe not exists):', e.original?.message || e.message);
        }

        // 2. Create correct index
        try {
            await sequelize.query('ALTER TABLE folios ADD UNIQUE KEY uq_folios_tenant_folioNumber (tenantId, folio_numero)');
            console.log('✅ Created correct index (tenantId, folio_numero)');
        } catch (e) {
            console.error('❌ Failed to create new index:', e.original?.message || e.message);
        }

    } catch (error) {
        console.error('❌ Critical Failure:', error);
    } finally {
        await sequelize.close();
    }
};

if (require.main === module) {
    migrate();
}
