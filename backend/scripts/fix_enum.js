require('dotenv').config({ path: '../.env' });
const { sequelize } = require('../models');

async function fixEnum() {
    console.log('🛠 Normalizing globalRole ENUM to canonical values...');
    try {
        await sequelize.authenticate();

        // Current enum: ADMIN, USER, Administrador, Usuario, employee, owner
        // Target: SUPER_ADMIN, ADMIN, USER

        // Step 1: Add SUPER_ADMIN to existing enum
        console.log('Step 1: Adding SUPER_ADMIN to ENUM...');
        await sequelize.query(`
            ALTER TABLE users 
            MODIFY COLUMN globalRole 
            ENUM('SUPER_ADMIN', 'ADMIN', 'USER', 'Administrador', 'Usuario', 'employee', 'owner') 
            NOT NULL DEFAULT 'USER'
        `);

        // Step 2: Migrate data to canonical values
        console.log('Step 2: Migrating existing data...');

        // Migrate 'Administrador' to 'ADMIN' (ADMIN already exists, so just update Administrador)
        await sequelize.query(`
            UPDATE users 
            SET globalRole = 'ADMIN' 
            WHERE globalRole = 'Administrador'
        `);

        // Migrate all user/employee/owner variants to 'USER'
        await sequelize.query(`
            UPDATE users 
            SET globalRole = 'USER' 
            WHERE globalRole IN ('employee', 'Usuario', 'owner')
        `);

        // Step 3: Remove old values from ENUM (keep only canonical)
        console.log('Step 3: Finalizing ENUM with canonical values only...');
        await sequelize.query(`
            ALTER TABLE users 
            MODIFY COLUMN globalRole 
            ENUM('SUPER_ADMIN', 'ADMIN', 'USER') 
            NOT NULL DEFAULT 'USER'
        `);

        console.log('✅ globalRole ENUM normalized successfully!');
        console.log('   - SUPER_ADMIN: Full system access');
        console.log('   - ADMIN: System administration');
        console.log('   - USER: Standard user (tenant roles via tenant_users)');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error normalizing ENUM:', error);
        process.exit(1);
    }
}

fixEnum();
