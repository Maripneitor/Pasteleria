require('dotenv').config({ path: '../.env' });
const { sequelize } = require('../models');

const migrate = async () => {
    try {
        await sequelize.authenticate();
        console.log('🔌 Connected to DB');

        await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');

        // Fix Incompatible Column Types (BIGINT -> INTEGER)
        try {
            await sequelize.query('ALTER TABLE cake_flavors MODIFY COLUMN tenantId INTEGER NOT NULL');
            console.log('✅ Fixed cake_flavors.tenantId type');
        } catch (e) { console.log('ℹ️ cake_flavors fix skipped/failed'); }

        try {
            await sequelize.query('ALTER TABLE fillings MODIFY COLUMN tenantId INTEGER NOT NULL');
            console.log('✅ Fixed fillings.tenantId type');
        } catch (e) { console.log('ℹ️ fillings fix skipped/failed'); }

        const tables = ['folio_edit_histories', 'audit_logs', 'activation_codes', 'user_sessions', 'ai_sessions', 'cash_movements', 'cash_cuts', 'commissions', 'folio_payments', 'folios', 'tenant_users'];
        for (const t of tables) {
            try {
                await sequelize.query(`ALTER TABLE ${t} MODIFY COLUMN tenantId INTEGER DEFAULT 1`);
                console.log(`✅ Fixed ${t}.tenantId type`);
            } catch (e) { console.log(`ℹ️ ${t} fix skipped: ${e.original?.sqlMessage}`); }
        }

        // Drop if exists to be sure
        await sequelize.query('DROP TABLE IF EXISTS branches');
        await sequelize.query('DROP TABLE IF EXISTS tenants');

        // 1. Create Tenants
        await sequelize.query(`
            CREATE TABLE IF NOT EXISTS tenants (
                id INTEGER NOT NULL AUTO_INCREMENT,
                businessName VARCHAR(255) NOT NULL DEFAULT 'Mi Pastelería',
                logoUrl VARCHAR(255),
                primaryColor VARCHAR(7) DEFAULT '#ec4899',
                pdfHeaderText TEXT,
                pdfFooterText TEXT,
                website VARCHAR(255),
                createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                PRIMARY KEY (id)
            ) ENGINE=InnoDB;
        `);
        console.log('✅ Table tenants created');

        // 2. Create Branches
        // Note: We use simple INTEGER for tenantId to match tenants.id
        await sequelize.query(`
            CREATE TABLE IF NOT EXISTS branches (
                id INTEGER NOT NULL AUTO_INCREMENT,
                name VARCHAR(255) NOT NULL,
                address VARCHAR(255),
                phone VARCHAR(255),
                tenantId INTEGER NOT NULL,
                isMain TINYINT(1) DEFAULT 0,
                createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                PRIMARY KEY (id),
                CONSTRAINT fk_branches_tenant FOREIGN KEY (tenantId) REFERENCES tenants (id) ON DELETE CASCADE ON UPDATE CASCADE
            ) ENGINE=InnoDB;
        `);
        console.log('✅ Table branches created');

        // 3. Add branchId to users if not exists
        const [columns] = await sequelize.query("SHOW COLUMNS FROM users LIKE 'branchId'");
        if (columns.length === 0) {
            await sequelize.query(`
                ALTER TABLE users 
                ADD COLUMN branchId INTEGER DEFAULT NULL COMMENT 'ID de la sucursal física asignada'
                AFTER tenantId;
            `);
            console.log('✅ Column branchId added to users');

            // Allow time for index to populate before adding FK if needed
            // For now, we won't add strict FK on users to prevent "Cannot add foreign key" if types mismatch slightly
            // We'll let Sequelize sync try or just leave it logical for now
        } else {
            console.log('ℹ️ Column branchId already exists in users');
        }

        await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
    } catch (e) {
        console.error('❌ Migration Failed:', e.parent ? e.parent.sqlMessage : e);
    }
};

migrate().then(() => process.exit());
