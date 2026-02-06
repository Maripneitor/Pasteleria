const { sequelize, Folio, User, Client } = require('../../models');
const { chalk, ok, fail } = require('./_report');

async function seedContractData() {
    console.log(chalk.blue('🌱 Seeding Contract Data...'));

    try {
        await sequelize.authenticate();

        // 1. Ensure Admin User has a Branch
        const admin = await User.findOne({ where: { email: 'admin@gmail.com' } });
        if (admin) {
            console.log(chalk.blue(`  - Admin Found: ${admin.id}, Branch: ${admin.branchId}`));
            if (!admin.branchId) {
                // Ensure Branch 1 Exists
                const { Branch } = require('../../models');
                const b1 = await Branch.findByPk(1);
                if (!b1) {
                    console.log(chalk.yellow('  - Branch 1 missing. Creating dummy branch...'));

                    // Create Branch 1 for Tenant 1
                    try {
                        const newBranch = await Branch.create({
                            id: 1, // Force ID 1
                            tenantId: 1,
                            name: 'Sucursal Matriz',
                            address: 'Calle Falsa 123',
                            phone: '555-555-5555',
                            status: 'ACTIVE'
                        });
                        console.log(chalk.green('  - Created Branch 1'));
                    } catch (err) {
                        console.error('Error creating branch:', err);
                        // Try finding it again (race condition?)
                    }

                    // Need a tenant. Admin doesn't have tenantId? 
                    // Admin usually GLOBAL. 
                    // But if we assign branch, it implies a Tenant. 
                    // If Admin is Global, they shouldn't belong to a branch?
                    // User requirements: "permitir 'cambiar de sucursal' con header" (Option B) 
                    // OR "volver a stricto: branchless = solo OWNER y SUPER_ADMIN" (Option A).

                    // IF I chose Option A: ADMIN MUST have a branch.
                    // Meaning ADMIN acts as an EMPLOYEE of a Tenant?
                    // If Admin is Platform Admin (Global), then they shouldn't be tied to a specific branch of a specific tenant?
                    // Wait. "ADMIN" in this system...
                    // "Opción A: volver a estricto: branchless roles = solo OWNER y SUPER_ADMIN."
                    // This implies ADMIN is *Tenant* Admin?
                    // If so, they need `tenantId`.

                    // The token shows "tenantId": null.
                    // If Admin is Global Admin (Platform), then they *should* be Super Admin?
                    // The prompt said: "Option A... volver a stricto. branchless roles = solo OWNER y SUPER_ADMIN".
                    // And "ADMIN sigue teniendo branchId obligatorio".
                    // This implies ADMIN is a Tenant-level role that manages a branch (like Manager?).

                    // So, yes, Admin needs `tenantId` AND `branchId`.

                    admin.tenantId = 1;
                    admin.branchId = 1;
                    await admin.save();
                    console.log(chalk.blue('  - Assigned Tenant 1 / Branch 1 to Admin'));
                } else {
                    admin.branchId = 1;
                    // Also ensure TenantId
                    if (!admin.tenantId) admin.tenantId = 1;
                    await admin.save();
                    console.log(chalk.blue('  - Updated Admin with Branch 1'));
                }
            }
        } else {
            console.log(chalk.red('  - ADMIN USER NOT FOUND'));
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
                cliente_nombre: 'Seed For PDF',
                cliente_telefono: '0000000000',
                status: 'CONFIRMED', // Needs to be confirmed? summary might list all or confirmed. 
                // Service usually filters. Let's make it CONFIRMED to be safe.
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
