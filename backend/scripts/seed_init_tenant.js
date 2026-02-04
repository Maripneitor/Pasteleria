require('dotenv').config();
const { sequelize, Tenant, Branch, User } = require('../models');

const seedInitTenant = async () => {
    console.log('🌱 Seeding Initial Tenant Structure...');

    try {
        await sequelize.authenticate();

        // 1. Create Default Tenant if not exists
        const [tenant, createdT] = await Tenant.findOrCreate({
            where: { id: 1 },
            defaults: {
                businessName: 'Pastelería La Fiesta',
                logoUrl: 'https://placehold.co/400x200?text=Logo',
                primaryColor: '#ec4899',
                pdfHeaderText: 'Pastelería Artesanal - La Fiesta',
                pdfFooterText: 'Gracias por su preferencia - Pedidos al 555-1234'
            }
        });

        if (createdT) console.log('✅ Created Default Tenant: ID 1');
        else console.log('ℹ️ Default Tenant already exists.');

        // 2. Create Default Branch (Matriz)
        const [branch, createdB] = await Branch.findOrCreate({
            where: { id: 1 },
            defaults: {
                name: 'Matriz - Centro',
                address: 'Calle Principal #123, Centro',
                phone: '555-000-1111',
                tenantId: tenant.id,
                isMain: true
            }
        });

        if (createdB) console.log('✅ Created Default Branch: ID 1');
        else console.log('ℹ️ Default Branch already exists.');

        // 3. Migrate Users (Assign to Tenant/Branch)
        // Find users without branchId or without tenantId
        const usersToFix = await User.findAll({
            where: {
                // Fix anyone missing tenant OR branch
                // NOTE: SuperAdmin might not need branch, but let's assign for safety
                [sequelize.Sequelize.Op.or]: [
                    { tenantId: null },
                    { branchId: null }
                ]
            }
        });

        if (usersToFix.length > 0) {
            console.log(`🛠️ Fixing ${usersToFix.length} users...`);
            for (const user of usersToFix) {
                user.tenantId = tenant.id;
                user.branchId = branch.id;
                await user.save();
            }
            console.log('✅ Users Migrated to Default Tenant/Branch.');
        } else {
            console.log('👍 All users already assigned.');
        }

    } catch (error) {
        console.error('❌ Tenant Seed Failed:', error);
    }
};

// Run if called directly
if (require.main === module) {
    seedInitTenant().then(() => process.exit());
}

module.exports = seedInitTenant;
