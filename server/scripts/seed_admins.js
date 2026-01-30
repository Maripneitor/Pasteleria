require('dotenv').config({ path: '../.env' });
const { User, sequelize } = require('../models');
const bcrypt = require('bcryptjs');

const ADMINS = [
    {
        email: 'admin@gmail.com',
        password: 'Admin1234',
        username: 'SuperAdmin'
    },
    {
        email: 'mario@dev.com',
        password: 'mario123',
        username: 'MarioDev'
    }
];

async function seedAdmins() {
    console.log('🚀 Iniciando Seeding de Administradores...');

    try {
        await sequelize.authenticate();
        console.log('✅ Conexión a DB establecida.');

        let createdCount = 0;
        let updatedCount = 0;

        for (const admin of ADMINS) {
            const { email, password, username } = admin;

            // Buscar si ya existe
            const user = await User.findOne({ where: { email } });
            const hashedPassword = await bcrypt.hash(password, 10);

            if (user) {
                console.log(`📝 Actualizando usuario existente: ${email}`);
                // Actualizar password y asegurar rol
                user.password = hashedPassword;
                user.globalRole = 'Administrador';
                // Si el modelo soporta username y queremos forzarlo, descomentar:
                // user.username = username; 
                await user.save();
                updatedCount++;
            } else {
                console.log(`✨ Creando nuevo usuario admin: ${email}`);
                await User.create({
                    email,
                    password: hashedPassword,
                    username,
                    globalRole: 'Administrador' // Aseguramos que sea admin
                    // tenantId se omite para que la DB use su valor por defecto (1)
                });
                createdCount++;
            }
        }

        console.log('\n📊 Resumen de Ejecución:');
        console.log(`   - Creados: ${createdCount}`);
        console.log(`   - Actualizados: ${updatedCount}`);
        console.log('   - Usuarios procesados:', ADMINS.map(a => a.email).join(', '));

        console.log('\n✅ Proceso completado exitosamente.');
        process.exit(0);

    } catch (error) {
        console.error('❌ Error Seeding Admins:', error);
        process.exit(1);
    }
}

seedAdmins();
