const bcrypt = require('bcryptjs');
const { sequelize } = require('../config/database');
const User = require('../models/user');

/**
 * Script para crear usuarios de prueba con diferentes roles
 * Ejecutar con: npm run seed:users
 */

async function seedUsers() {
    console.log('🔐 Iniciando creación de usuarios de prueba...');

    try {
        // Sincronizar base de datos
        await sequelize.sync();

        const users = [
            {
                name: "Otero",
                email: "dueño@gmail.com",
                password: await bcrypt.hash("OteroPastel7", 10),
                role: "OWNER",
                status: "ACTIVE",
                tenantId: 1,
                maxUsers: 50
            },
            {
                name: "Admin Principal",
                email: "admin@gmail.com",
                password: await bcrypt.hash("Admin1234", 10),
                role: "ADMIN",
                status: "ACTIVE",
                tenantId: 1,
                maxUsers: 10
            },
            {
                name: "Mario Dev",
                email: "mario@dev.com",
                password: await bcrypt.hash("mario123", 10),
                role: "ADMIN",
                status: "ACTIVE",
                tenantId: 1,
                maxUsers: 10
            },
            {
                name: "Empleado 1",
                email: "empleado@gmail.com",
                password: await bcrypt.hash("Harina2024", 10),
                role: "EMPLOYEE",
                status: "ACTIVE",
                tenantId: 1,
                ownerId: null, // Se asignará al dueño después si es necesario
                maxUsers: 0
            }
        ];

        // Crear usuarios (ignorar duplicados por email único)
        for (const userData of users) {
            const exists = await User.findOne({ where: { email: userData.email } });
            if (exists) {
                console.log(`⚠️  Usuario ${userData.email} ya existe, omitiendo...`);
            } else {
                await User.create(userData);
                console.log(`✅ Usuario creado: ${userData.email} (${userData.role})`);
            }
        }

        console.log('\n✅ Proceso completado!');
        console.log('\n📋 Credenciales de acceso:');
        console.log('──────────────────────────────────────────');
        console.log('DUEÑO:');
        console.log('  Email: dueño@gmail.com');
        console.log('  Password: OteroPastel7');
        console.log('');
        console.log('ADMIN:');
        console.log('  Email: admin@gmail.com');
        console.log('  Password: Admin1234');
        console.log('');
        console.log('ADMIN DEV:');
        console.log('  Email: mario@dev.com');
        console.log('  Password: mario123');
        console.log('');
        console.log('EMPLEADO:');
        console.log('  Email: empleado@gmail.com');
        console.log('  Password: Harina2024');
        console.log('──────────────────────────────────────────');

    } catch (error) {
        console.error('❌ Error al crear usuarios:', error.message);
        console.error(error);
        process.exit(1);
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    seedUsers()
        .then(() => {
            console.log('\n🎉 Script finalizado exitosamente');
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Error fatal:', error);
            process.exit(1);
        });
}

module.exports = { seedUsers };
