// server/scripts/qa/sync_db.js
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const { sequelize } = require('../../models');

async function sync() {
    console.log('🔄 QA: Checking/Syncing Database Schema...');
    try {
        // connect
        await sequelize.authenticate();
        // Default sync: CREATE TABLE IF NOT EXISTS
        // We avoid { alter: true } to prevent 'Too many keys' errors on existing tables
        await sequelize.sync();
        console.log('✅ QA: Database Sync Complete');
        process.exit(0);
    } catch (err) {
        console.error('❌ QA: Database Sync Failed:', err);
        process.exit(1);
    }
}

sync();
