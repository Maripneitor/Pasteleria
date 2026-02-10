const { sequelize, User, Tenant, Branch, Client, Product, Flavor, Filling, Folio, CashCut } = require('../models');
const bcrypt = require('bcryptjs');

async function seedFull() {
    try {
        console.log("🌱 Starting Zero-Config Seed...");
        await sequelize.sync({ alter: true }); // Ensure schema is ready

        // 1. Create Super Admin (Global)
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@macair.com';
        const adminPass = process.env.ADMIN_PASSWORD || 'admin123';
        const hashedPassword = await bcrypt.hash(adminPass, 10);

        const [superAdmin, createdSA] = await User.findOrCreate({
            where: { email: adminEmail },
            defaults: {
                name: 'Super Admin',
                password: hashedPassword,
                role: 'SUPER_ADMIN',
                tenantId: null // Global
            }
        });
        console.log(`✅ SuperAdmin: ${adminEmail} (${createdSA ? 'Created' : 'Exists'})`);

        // 2. Create Default Tenant
        const [tenant, createdT] = await Tenant.findOrCreate({
            where: { businessName: 'Pastelería Demo' },
            defaults: {
                businessName: 'Pastelería Demo',
                primaryColor: '#ec4899'
                // Removed non-existent 'name' and 'settings'
            }
        });
        console.log(`✅ Tenant: ${tenant.businessName}`);

        // 3. Create Branches (Main & Secondary)
        const [mainBranch] = await Branch.findOrCreate({
            where: { name: 'Matriz Centro', tenantId: tenant.id },
            defaults: { address: 'Av. Principal #123', phone: '555-0001', isMain: true }
        });
        const [sucursalNorte] = await Branch.findOrCreate({
            where: { name: 'Sucursal Norte', tenantId: tenant.id },
            defaults: { address: 'Plaza Norte L-4', phone: '555-0002', isMain: false }
        });

        // 4. Create Roles (Owner & Employee)
        const [owner] = await User.findOrCreate({
            where: { email: 'owner@demo.com' },
            defaults: {
                name: 'Dueño Demo',
                password: hashedPassword,
                role: 'OWNER',
                tenantId: tenant.id
            }
        });

        const [employee] = await User.findOrCreate({
            where: { email: 'cajero@demo.com' },
            defaults: {
                name: 'Cajero Matriz',
                password: hashedPassword,
                role: 'EMPLOYEE',
                tenantId: tenant.id,
                branchId: mainBranch.id
            }
        });

        // 5. Seed Catalog (Products, Flavors, Fillings)
        const products = [
            { name: 'Pastel Individual', basePrice: 45, category: 'Línea', tenantId: tenant.id },
            { name: 'Pastel 10 Personas', basePrice: 250, category: 'Línea', tenantId: tenant.id },
            { name: 'Pastel 20 Personas', basePrice: 450, category: 'Línea', tenantId: tenant.id },
        ];
        for (const p of products) {
            await Product.findOrCreate({
                where: { name: p.name, tenantId: tenant.id },
                defaults: p
            });
        }

        const flavors = ['Vainilla', 'Chocolate', 'Fresa', 'Moka', 'Tres Leches'];
        for (const f of flavors) {
            await Flavor.findOrCreate({
                where: { name: f, tenantId: tenant.id },
                defaults: { isActive: true }
            });
        }

        const fillings = ['Fresas con Crema', 'Durazno', 'Nuez', 'Cajeta'];
        for (const f of fillings) {
            await Filling.findOrCreate({
                where: { name: f, tenantId: tenant.id },
                defaults: { isActive: true }
            });
        }
        console.log("✅ Catalog Seeded");

        // 6. Seed Clients (Registered)
        const [client1] = await Client.findOrCreate({
            where: { phone: '5551112222', tenantId: tenant.id },
            defaults: { name: 'Cliente Frecuente', email: 'cliente@test.com' }
        });

        // 7. Seed Orders (History)
        // Some past orders for stats
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);

        await Folio.findOrCreate({
            where: { cliente_nombre: 'Pedido Histórico', tenantId: tenant.id },
            defaults: {
                cliente_telefono: '000',
                status: 'DELIVERED',
                total: 500,
                anticipo: 500,
                estatus_pago: 'Pagado',
                createdAt: lastMonth,
                branchId: mainBranch.id
            }
        });

        console.log("✅ History Seeded");
        console.log("🚀 ZERO-CONFIG SEED COMPLETE!");
        process.exit(0);
    } catch (e) {
        console.error("❌ Seed Failed:", e);
        process.exit(1);
    }
}

seedFull();
