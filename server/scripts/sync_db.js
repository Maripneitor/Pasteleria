require('dotenv').config();
const { sequelize } = require('../models');

async function sync() {
    console.log("🔄 Syncing Database with ALTER=true...");
    try {
        await sequelize.sync({ alter: true });
        console.log("✅ Database Synced Successfully.");
    } catch (e) {
        console.error("❌ Sync Failed:", e);
    } finally {
        await sequelize.close();
    }
}

sync();
