const fs = require('fs');
const path = require('path');
const { sequelize } = require('../models');

async function repairDB() {
    try {
        console.log("🔧 Starting DB Repair...");
        const sqlPath = path.join(__dirname, 'db_repair_tenantId.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        await sequelize.authenticate();
        console.log("✅ DB Connected.");

        const commands = sql.split(';').filter(cmd => cmd.trim());
        for (const cmd of commands) {
            if (!cmd.trim()) continue;
            try {
                await sequelize.query(cmd);
                console.log(`✅ Executed: ${cmd.substring(0, 50)}...`);
            } catch (e) {
                console.warn(`⚠️ Warning executing ${cmd.substring(0, 30)}...: ${e.message}`);
            }
        }
        console.log("✅ Repair Complete.");
    } catch (e) {
        console.error("❌ Repair Failed:", e);
    } finally {
        await sequelize.close();
    }
}

repairDB();
