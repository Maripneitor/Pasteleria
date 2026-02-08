const bcrypt = require('bcryptjs');
const { User, sequelize } = require('../models');

async function reset() {
    try {
        await sequelize.authenticate();
        const hash = await bcrypt.hash('password123', 10);
        const [updated] = await User.update({ password: hash }, { where: { email: 'admin@lafiesta.com' } });
        if (updated) {
            console.log('✅ Password reset to password123 for admin@lafiesta.com');
        } else {
            console.log('❌ User not found');
        }
    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}
reset();
