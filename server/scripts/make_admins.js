/**
 * Idempotente:
 * - Si el usuario NO existe: lo crea con password bcrypt
 * - Si existe: le fuerza rol ADMIN/Administrador (según tu columna)
 */
require('dotenv').config({ path: '../.env' });
const bcrypt = require('bcryptjs');
const { User, sequelize } = require('../models');

const admins = [
    { email: 'admin@gmail.com', password: 'Admin1234', username: 'Admin' },
    { email: 'mario@dev.com', password: 'mario123', username: 'Mario' },
];

function setRoleFields(user) {
    // Soporta ambos estilos (base antigua y base mejorada)
    // - base vieja: user.role = 'Administrador'
    // - base tenant/global: user.globalRole = 'Administrador' (adjusted from ADMIN per previous fix)

    // Note: Previous steps confirmed globalRole ENUM uses 'Administrador'
    if (user.dataValues.hasOwnProperty('globalRole')) user.globalRole = 'Administrador';
    if (user.dataValues.hasOwnProperty('role')) user.role = 'Administrador';
    if (user.dataValues.hasOwnProperty('isActive')) user.isActive = 1;
}

async function run() {
    console.log('🚀 Running make_admins.js...');
    await sequelize.authenticate();

    for (const a of admins) {
        const [user, created] = await User.findOrCreate({
            where: { email: a.email },
            defaults: {
                username: a.username,
                email: a.email,
                password: await bcrypt.hash(a.password, 10),
                globalRole: 'Administrador' // Direct default
            },
        });

        // si existía, no tocamos password a menos que quieras forzarlo:
        if (!created) {
            // Optional: Force password update if needed
            user.password = await bcrypt.hash(a.password, 10);
        }

        setRoleFields(user);
        await user.save();

        console.log(`✅ ${a.email} => ADMIN (${created ? 'created' : 'updated'})`);
    }
    process.exit(0);
}

run().catch((e) => {
    console.error('❌ make_admins error:', e);
    process.exit(1);
});
