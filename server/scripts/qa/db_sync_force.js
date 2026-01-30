const { sequelize } = require('../../models');

async function sync() {
    console.log("🔄 Force Syncing Database Models...");
    try {
        await sequelize.sync();
        console.log("✅ Database Synced Successfully.");
        process.exit(0);
    } catch (e) {
        console.error("❌ Sync Failed:", e);
        process.exit(1);
    }
}

sync();
