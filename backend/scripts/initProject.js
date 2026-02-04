/**
 * INIT PROJECT SCRIPT
 * 1. Syncs Database (Alter)
 * 2. Seeds Admins
 * 3. Seeds Basic Catalogs
 */
require('dotenv').config({ path: '../.env' }); // Adjust path if running from scripts dir
const { sequelize } = require('../config/database');
const bcrypt = require('bcryptjs');

// Import Models to ensure they are registered
require('../models');
const User = require('../models/user');
const CakeFlavor = require('../models/CakeFlavor');
const Filling = require('../models/Filling');

const dbInit = async () => {
    console.log('🚀 Initializing Project Pastelería...');

    try {
        // 1. Authenticate
        await sequelize.authenticate();

        // 2. Check DB_SYNC_MODE
        // Modes: 
        // - 'none': Do nothing (Production/SAFE)
        // - 'qa': Sync only (create tables if missing, no alter)
        // - 'smart': Run smartSync (add cols) + Sync
        // - 'alter': Full alter (Dev only)

        const syncMode = process.env.DB_SYNC_MODE || 'none';
        console.log(`[DB_INIT] mode=${syncMode} action=starting`);

        if (syncMode === 'none') {
            console.log('[DB_INIT] mode=none -> Skipping Schema Sync (Safe Mode)');
            // No action needed
        }
        else if (syncMode === 'qa') {
            console.log('[DB_INIT] mode=qa -> Running Standard Sync (No Alter)');
            await sequelize.sync();
        }
        else if (syncMode === 'smart') {
            console.log('[DB_INIT] mode=smart -> Running SmartSync + Standard Sync');
            const smartSync = require('./smartSync');
            await smartSync(); // Add missing columns safely
            await sequelize.sync(); // Ensure tables exist
        }
        else if (syncMode === 'alter') {
            console.log('[DB_INIT] mode=alter -> Running Sync with { alter: true }');
            await sequelize.sync({ alter: true });
        }
        else if (syncMode === 'force') {
            console.log('[DB_INIT] mode=force -> ⚠️ DESTRUCTIVE RESET (Force)');
            await sequelize.sync({ force: true });
        }
        else {
            console.warn(`[DB_INIT] Unknown mode '${syncMode}' -> Defaulting to 'none'`);
        }

        // 2. Seed Admins
        const admins = [
            { email: 'admin@gmail.com', password: 'Admin1234', username: 'Admin', globalRole: 'ADMIN' },
            { email: 'mario@dev.com', password: 'commario123', username: 'Mario', globalRole: 'SUPER_ADMIN' },
        ];

        for (const a of admins) {
            const [user, created] = await User.findOrCreate({
                where: { email: a.email },
                defaults: {
                    username: a.username,
                    email: a.email,
                    password: await bcrypt.hash(a.password, 10),
                    globalRole: a.globalRole,
                    status: 'ACTIVE'
                },
            });
            if (!created) {
                // Ensure password/role matches dev environment expectations
                // user.password = await bcrypt.hash(a.password, 10);
                // user.globalRole = a.globalRole;
                // await user.save();
            }
        }
        console.log('✅ Admins Seeded');

        // 3. Seed Basic Catalogs (if empty)
        const flavorCount = await CakeFlavor.count();
        if (flavorCount === 0) {
            await CakeFlavor.bulkCreate([
                { name: 'Vainilla', tenantId: 1 },
                { name: 'Chocolate', tenantId: 1 },
                { name: 'Red Velvet', tenantId: 1 },
                { name: 'Zanahoria', tenantId: 1 },
            ]);
            console.log('✅ Flavors Seeded');
        }

        const fillingCount = await Filling.count();
        if (fillingCount === 0) {
            await Filling.bulkCreate([
                { name: 'Fresa', tenantId: 1 },
                { name: 'Chocolate', tenantId: 1 },
                { name: 'Cajeta', tenantId: 1 },
                { name: 'Queso Crema', tenantId: 1 },
            ]);
            console.log('✅ Fillings Seeded');
        }

        console.log('🏁 Initialization Complete.');
        return true;

    } catch (error) {
        console.error('❌ Init Failed:', error);
        throw error;
    }
};

// Run if called directly
if (require.main === module) {
    dbInit().then(() => process.exit(0)).catch(() => process.exit(1));
}

module.exports = { dbInit };
