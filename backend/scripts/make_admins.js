/**
 * Idempotent Admin Seeder
 * Creates or updates admin accounts with exact credentials
 */
require('dotenv').config({ path: '../.env' });
const bcrypt = require('bcryptjs');
const { User, sequelize } = require('../models');

const admins = [
    { email: 'admin@gmail.com', password: 'Admin1234', username: 'Admin', globalRole: 'ADMIN' },
    { email: 'mario@dev.com', password: 'commario123', username: 'Mario', globalRole: 'SUPER_ADMIN' },
];

async function run() {
    console.log('🚀 Running make_admins.js with canonical roles...');
    await sequelize.authenticate();

    for (const a of admins) {
        const [user, created] = await User.findOrCreate({
            where: { email: a.email },
            defaults: {
                username: a.username,
                email: a.email,
                password: await bcrypt.hash(a.password, 10),
                globalRole: a.globalRole,
                status: 'ACTIVE' // Admins are always active
            },
        });

        // If user existed, update password and role
        if (!created) {
            user.password = await bcrypt.hash(a.password, 10);
            user.globalRole = a.globalRole;
            user.status = 'ACTIVE';
            await user.save();
        }

        console.log(`✅ ${a.email} => ${a.globalRole} (${created ? 'created' : 'updated'})`);
    }

    console.log('\n📋 Admin Summary:');
    console.log('   - admin@gmail.com / Admin1234 => ADMIN');
    console.log('   - mario@dev.com / commario123 => SUPER_ADMIN');

    process.exit(0);
}

run().catch((e) => {
    console.error('❌ make_admins error:', e);
    process.exit(1);
});
