require('dotenv').config();
const { sequelize } = require('../models');

async function migrateSprint4() {
    console.log("🚀 Starting Sprint 4 Migration...");
    const queryInterface = sequelize.getQueryInterface();

    try {
        // 1. Update User Table
        console.log("   Example: Altering Users table...");

        // Add status
        try {
            await sequelize.query("ALTER TABLE users ADD COLUMN status ENUM('PENDING', 'ACTIVE', 'BLOCKED') NOT NULL DEFAULT 'PENDING';");
            console.log("      ✅ Added 'status'");
            // Backfill existing users as ACTIVE
            await sequelize.query("UPDATE users SET status = 'ACTIVE' WHERE 1=1;");
            console.log("      ✅ Backfilled status='ACTIVE'");
        } catch (e) { console.log("      ℹ️ status column likely exists"); }

        // Add ownerId
        try {
            await sequelize.query("ALTER TABLE users ADD COLUMN ownerId BIGINT NULL;");
            console.log("      ✅ Added 'ownerId'");
        } catch (e) { console.log("      ℹ️ ownerId column likely exists"); }

        // Add maxUsers
        try {
            await sequelize.query("ALTER TABLE users ADD COLUMN maxUsers INT NOT NULL DEFAULT 5;");
            console.log("      ✅ Added 'maxUsers'");
        } catch (e) { console.log("      ℹ️ maxUsers column likely exists"); }

        // 2. Create Activation Codes Table
        // We use sync({alter:true}) for new models usually, but manual is safer for constraints
        // Let's use raw SQL for creating new tables to be precise
        console.log("   Creating activation_codes table...");
        try {
            await sequelize.query(`
                CREATE TABLE IF NOT EXISTS activation_codes (
                    id INTEGER PRIMARY KEY AUTO_INCREMENT,
                    code VARCHAR(6) NOT NULL UNIQUE,
                    ownerId BIGINT NOT NULL,
                    tenantId INTEGER NOT NULL,
                    targetRole VARCHAR(255) DEFAULT 'employee',
                    status ENUM('UNUSED', 'USED') DEFAULT 'UNUSED',
                    expiresAt DATETIME NOT NULL,
                    usedAt DATETIME NULL,
                    usedByUserId BIGINT NULL,
                    createdAt DATETIME NOT NULL,
                    updatedAt DATETIME NOT NULL
                );
            `);
            console.log("      ✅ Table activation_codes ready");
        } catch (e) { console.error("      ❌ activation_codes error:", e.message); }

        // 3. Create User Sessions Table
        console.log("   Creating user_sessions table...");
        try {
            await sequelize.query(`
                CREATE TABLE IF NOT EXISTS user_sessions (
                    id INTEGER PRIMARY KEY AUTO_INCREMENT,
                    userId BIGINT NOT NULL,
                    tokenSignature VARCHAR(255) NOT NULL,
                    deviceInfo VARCHAR(255) NULL,
                    ip VARCHAR(255) NULL,
                    isActive BOOLEAN DEFAULT TRUE,
                    lastSeenAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                    expiresAt DATETIME NULL,
                    createdAt DATETIME NOT NULL,
                    updatedAt DATETIME NOT NULL,
                    INDEX idx_user_active (userId, isActive)
                );
            `);
            console.log("      ✅ Table user_sessions ready");
        } catch (e) { console.error("      ❌ user_sessions error:", e.message); }

    } catch (e) {
        console.error("🔥 Migration Error:", e);
    } finally {
        await sequelize.close();
    }
}

migrateSprint4();
