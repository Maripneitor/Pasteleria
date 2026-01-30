const { sequelize } = require('../../models');

async function fix() {
    console.log("🛠️  Fixing DB Schema (Drop specific tables + Sync)...");
    try {
        const queryInterface = sequelize.getQueryInterface();

        console.log("Dropping audit_logs...");
        await queryInterface.dropTable('audit_logs');

        console.log("Dropping ai_sessions...");
        await queryInterface.dropTable('ai_sessions');

        // Note: You might need to drop cash_movements/cash_cuts if they had issues too, but they were created fresh so probably fine.

        console.log("Syncing...");
        await sequelize.sync(); // Recreates missing tables

        console.log("✅ DB Fixed.");
        process.exit(0);
    } catch (e) {
        console.error("❌ Fix Failed:", e);
        process.exit(1);
    }
}

fix();
