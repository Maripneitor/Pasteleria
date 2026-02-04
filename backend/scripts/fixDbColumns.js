
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const { sequelize } = require('../config/database');

const fixDbColumns = async () => {
    console.log('🔧 Running DB Column Fixes...');

    try {
        const qi = sequelize.getQueryInterface();

        // Fix: altura_extra should be STRING, not INTEGER
        console.log('👉 Altering `altura_extra` to VARCHAR(255)...');
        await sequelize.query("ALTER TABLE folios MODIFY COLUMN altura_extra VARCHAR(255) DEFAULT 'No';");
        console.log('✅ `altura_extra` fixed.');

    } catch (error) {
        console.error('❌ DB Fix Failed:', error.message);
    } finally {
        await sequelize.close();
    }
};

fixDbColumns();
