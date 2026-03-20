const { sequelize, User, Tenant, Branch, Product, Flavor, CakeFlavor, Filling, Folio, CakeShape } = require('../models');

const bcrypt = require('bcryptjs');

async function seedFull() {
    try {
        console.log("🌱 Starting Zero-Config Seed...");
        // Ensure schema is ready (Safety sync)
        if (process.env.DB_SYNC_MODE === 'alter') {
            await sequelize.sync({ alter: true });
        }

        // Generic hash for defaults
        const defaultHash = await bcrypt.hash('admin123', 10);
        const superAdminHash = await bcrypt.hash('Admin1234', 10);
        const marioHash = await bcrypt.hash('mario123', 10);

        // 1. Super Admins (Global)
        // SuperAdmin 1
        await User.findOrCreate({
            where: { email: 'admin@gmail.com' },
            defaults: {
                name: 'Super Admin 1',
                password: superAdminHash,
                role: 'SUPER_ADMIN',
                tenantId: null
            }
        });
        // SuperAdmin 2
        await User.findOrCreate({
            where: { email: 'mario@dev.com' },
            defaults: {
                name: 'Mario Dev',
                password: marioHash,
                role: 'SUPER_ADMIN',
                tenantId: null
            }
        });
        console.log(`✅ SuperAdmins Created`);

        // 2. Tenant (Pastelería HQ)
        const [tenant] = await Tenant.findOrCreate({
            where: { businessName: 'Pastelería HQ' },
            defaults: {
                businessName: 'Pastelería HQ',
                primaryColor: '#ec4899',
                maxBranches: 3, // Limit requested: 3
                settings: {}
            }
        });
        console.log(`✅ Tenant: ${tenant.businessName}`);

        // 3. Branches (Centro & Norte)
        const [sucursalCentro] = await Branch.findOrCreate({
            where: { name: 'Centro', tenantId: tenant.id },
            defaults: { address: 'Av. Centro 100', phone: '555-0001', isMain: true, tenantId: tenant.id }
        });
        const [sucursalNorte] = await Branch.findOrCreate({
            where: { name: 'Norte', tenantId: tenant.id },
            defaults: { address: 'Plaza Norte 500', phone: '555-0002', isMain: false, tenantId: tenant.id }
        });
        console.log(`✅ Branches Created`);

        // 4. Users (Owner & Employee)
        await User.findOrCreate({
            where: { email: 'owner@demo.com' },
            defaults: {
                name: 'Dueño Demo',
                password: defaultHash,
                role: 'OWNER',
                tenantId: tenant.id
            }
        });

        await User.findOrCreate({
            where: { email: 'empleado@demo.com' },
            defaults: {
                name: 'Empleado Centro',
                password: defaultHash,
                role: 'EMPLOYEE',
                tenantId: tenant.id,
                branchId: sucursalCentro.id
            }
        });
        console.log(`✅ Tenant Users Created`);

        // 5. Catalog (Products, Flavors, Fillings)
        // Products (Prices are here)
        const products = [
            { name: 'Pastel Individual', basePrice: 45, category: 'Línea' },
            { name: 'Pastel 10 Personas', basePrice: 280, category: 'Línea' },
            { name: 'Pastel 20 Personas', basePrice: 480, category: 'Línea' },
            { name: 'Pastel 30 Personas', basePrice: 650, category: 'Línea' },
            { name: 'Cupcake Especial', basePrice: 25, category: 'Especial' }
        ];

        for (const p of products) {
            await Product.findOrCreate({
                where: { name: p.name, tenantId: tenant.id },
                defaults: { ...p, tenantId: tenant.id }
            });
        }

        // Flavors (5 items, price $0-$50)
        const flavors = [
            { name: 'Vainilla Clásica', price: 0 },
            { name: 'Chocolate Abuelita', price: 15 },
            { name: 'Red Velvet', price: 25 },
            { name: 'Tres Leches', price: 30 },
            { name: 'Zanahoria Especial', price: 50 }
        ];
        for (const f of flavors) {
            // Seed legacy Flavor model
            await Flavor.findOrCreate({
                where: { name: f.name, tenantId: tenant.id },
                defaults: { isActive: true, price: f.price, tenantId: tenant.id }
            });
            // Seed new CakeFlavor model
            await CakeFlavor.findOrCreate({
                where: { name: f.name, tenantId: tenant.id },
                defaults: { isActive: true, price: f.price, tenantId: tenant.id }
            });
        }

        // Fillings (5 items, price $0-$50)
        const fillings = [
            { name: 'Mermelada Fresa', price: 0 },
            { name: 'Crema Pastelera', price: 10 },
            { name: 'Durazno', price: 25 },
            { name: 'Nuez', price: 40 },
            { name: 'Nutella', price: 50 }
        ];
        for (const f of fillings) {
            await Filling.findOrCreate({
                where: { name: f.name, tenantId: tenant.id },
                defaults: { isActive: true, price: f.price, tenantId: tenant.id }
            });
        }
        console.log("✅ Catalog Populated");

        // 6. Shapes (Main and Complementary)
        const mainShapes = ['Redondo', 'Cuadrado', 'Corazón'];
        for (const s of mainShapes) {
            await CakeShape.findOrCreate({
                where: { name: s, tenantId: tenant.id, type: 'MAIN' },
                defaults: { name: s, price: 0, type: 'MAIN', tenantId: tenant.id }
            });
        }

        const compShapes = ['Plancha', 'Mini Redondo'];
        for (const s of compShapes) {
            await CakeShape.findOrCreate({
                where: { name: s, tenantId: tenant.id, type: 'COMPLEMENTARY' },
                defaults: { name: s, price: 0, type: 'COMPLEMENTARY', tenantId: tenant.id }
            });
        }
        console.log("✅ Shapes Populated");


        console.log("🚀 PLUG & PLAY SETUP COMPLETE!");
        process.exit(0);

    } catch (e) {
        console.error("❌ Seed Failed:", e);
        process.exit(1);
    }
}

seedFull();
