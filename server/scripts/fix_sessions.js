require('dotenv').config();
const { sequelize } = require('../models');

async function fix() {
    console.log("🛠 Recreating user_sessions table...");
    try {
        await sequelize.query("DROP TABLE IF EXISTS user_sessions;");
        console.log("   ✅ Dropped user_sessions");

        await sequelize.query(`
            CREATE TABLE user_sessions (
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
        console.log("   ✅ Re-created user_sessions");
    } catch (e) {
        console.error("❌ Error:", e);
    } finally {
        await sequelize.close();
    }
}

fix();
