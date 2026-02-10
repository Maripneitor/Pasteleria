const { sequelize, Folio, User, Client } = require('../../models');
const { chalk, ok, fail } = require('./_report');

async function seedContractData() {
    console.log(chalk.blue('🌱 Seeding Contract Data...'));

    try {
        await sequelize.authenticate();
        const { Tenant, Branch } = require('../../models');

        // 0. Ensure Tenant 1 Exists (Required for Admin and Branch)
        let tenant1 = await Tenant.findByPk(1);
        if (!tenant1) {
            console.log(chalk.yellow('  - Tenant 1 missing. Creating dummy tenant...'));
            try {
                tenant1 = await Tenant.create({
                    id: 1,
                    name: process.env.DEFAULT_TENANT_NAME || 'Mi Pastelería',
                    plan: 'PRO',
                    status: 'ACTIVE'
                });
                console.log(chalk.green('  - Created Tenant 1'));
            } catch (err) {
                console.error('Error creating tenant:', err);
            }
        }

        // 0.5 Ensure Branch 1 Exists (Required for Admin)
        let branch1 = await Branch.findByPk(1);
        if (!branch1) {
            console.log(chalk.yellow('  - Branch 1 missing. Creating dummy branch...'));
            try {
                branch1 = await Branch.create({
                    id: 1,
                    tenantId: 1,
                    name: 'Sucursal Matriz',
                    address: 'Calle Falsa 123',
                    phone: '555-555-5555',
                    status: 'ACTIVE'
                });
                console.log(chalk.green('  - Created Branch 1'));
            } catch (err) {
                console.error('Error creating branch:', err);
            }
        }

        // 1. Ensure Admin User Exists & Has Branch
        const email = process.env.ADMIN_EMAIL || 'admin@gmail.com';
        const password = process.env.ADMIN_PASSWORD || 'admin123';

        let admin = await User.findOne({ where: { email } });

        if (!admin) {
            console.log(chalk.yellow(`  - Admin (${email}) not found. Creating...`));
            const bcrypt = require('bcryptjs'); // Ensure bcrypt is available
            const hashedPassword = await bcrypt.hash(password, 10);

            admin = await User.create({
                name: 'Admin QA',
                username: 'admin_qa',
                email,
                password: hashedPassword,
                globalRole: 'SUPER_ADMIN',
                tenantId: 1,
                branchId: 1,
                status: 'ACTIVE'
            });
            console.log(chalk.green(`  - Created Admin User: ${email}`));
        } else {
            console.log(chalk.blue(`  - Admin Found: ${admin.id}, Branch: ${admin.branchId}`));
        }

        // Ensure Branch/Tenant assignment (Update existing user only)
        if (!admin.branchId || !admin.tenantId) {
            if (!admin.tenantId) admin.tenantId = 1;
            if (!admin.branchId) admin.branchId = 1;
            await admin.save();
            console.log(chalk.blue('  - Assigned Tenant 1 / Branch 1 to Admin'));
        }

        // 2. Create a Folio for "Today" so day-summary-pdf works
        // Using raw query or model? Model is better.
        // We need a valid tenantId. Assuming Tenant 1.

        const tenantId = 1;
        const now = new Date();
        // Force "Today" in Mexico Time logic?
        // The endpoint uses `req.query.date` or defaults to today.
        // We'll trust default for now, or the test creates one.

        // Check if we have any order for today
        const startOfDay = new Date(now.setHours(0, 0, 0, 0));
        const endOfDay = new Date(now.setHours(23, 59, 59, 999));

        const existing = await Folio.findOne({
            where: {
                tenantId,
                createdAt: {
                    [sequelize.Sequelize.Op.between]: [startOfDay, endOfDay]
                }
            }
        });

        if (!existing) {
            await Folio.create({
                tenantId,
                branchId: 1,
                cliente_nombre: 'Seed For PDF',
                cliente_telefono: '0000000000',
                status: 'CONFIRMED',
                total: 500.00,
                folio_numero: `SEED-${Date.now()}`
            });
            ok('Created Seeding Folio for Today');
        } else {
            console.log(chalk.blue('  - Folio for today already exists'));
        }

        return true;
    } catch (e) {
        fail('Seeding Failed', e);
        return false;
    }
}

if (require.main === module) {
    seedContractData().then(() => process.exit(0));
}

module.exports = { seedContractData };
