require('dotenv').config();
const { sequelize } = require('../models');

async function migrate() {
    console.log("🛠 Starting Safe ENUM Expansion...");
    const queryInterface = sequelize.getQueryInterface();

    try {
        // 1. Add tenantId column (if not exists)
        try {
            await sequelize.query("ALTER TABLE users ADD COLUMN tenantId INT NULL COMMENT 'ID de la sucursal/negocio principal';");
            console.log("      ✅ Column 'tenantId' added.");
        } catch (e) {
            console.log("      ℹ️ Column 'tenantId' already exists (or error):", e.code || e.message);
        }

        // 2. Modify ENUM: Keep OLD values + Add NEW values
        console.log("   -> Extending ENUM...");
        try {
            await sequelize.query("ALTER TABLE users MODIFY COLUMN globalRole ENUM('ADMIN', 'USER', 'Administrador', 'Usuario', 'employee', 'owner', 'admin') NOT NULL DEFAULT 'employee';");
            console.log("      ✅ ENUM updated.");
        } catch (e) {
            console.error("      ❌ Failed to update ENUM:", e.message);
            if (e.message.includes('duplicated value')) {
                console.log("      -> Retrying without 'admin' (assuming collision with ADMIN)...");
                try {
                    await sequelize.query("ALTER TABLE users MODIFY COLUMN globalRole ENUM('ADMIN', 'USER', 'Administrador', 'Usuario', 'employee', 'owner') NOT NULL DEFAULT 'employee';");
                    console.log("      ✅ ENUM updated (without lowercase admin).");
                } catch (e2) {
                    console.error("      ❌ Failed again:", e2.message);
                }
            }
        }

    } catch (e) {
        console.error("🔥 Migration Script Error:", e);
    } finally {
        await sequelize.close();
    }
}

migrate();
