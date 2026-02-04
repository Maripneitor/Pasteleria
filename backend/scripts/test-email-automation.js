const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const nodemailer = require('nodemailer');
const { sequelize } = require('../config/database');
const { CashCut } = require('../models/CashModels');

// MOCK Nodemailer
const sendMailMock = {
    sent: [],
    clear() { this.sent = []; }
};

// Override createTransport on the module itself
// This works because require('nodemailer') returns a singleton-like export
nodemailer.createTransport = () => ({
    sendMail: async (opts) => {
        console.log(`[MockSMTP] Sending email to ${opts.to} with subject "${opts.subject}"`);
        sendMailMock.sent.push(opts);
        return { messageId: 'mock-id' };
    }
});

// Require service AFTER mocking to ensure it picks up the modified nodemailer (if it requires inside function, certainly; if top-level, might depend on cache, but here we modify the exported object methods)
const { processDailyCutEmail } = require('../services/dailyCutEmailService');

const runTest = async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ DB Connected.');

        // SYNC SCHEMA to add missing columns `emailStatus`, `createdByUserId` (Local Dev only)
        // This is safe to run in this validation context to ensure the model matches what the code expects.
        console.log('🔄 Syncing CashCut schema...');
        await CashCut.sync({ alter: true });

        // Ensure test date is unique/cleanup
        const testDate = '2099-12-31';
        await sequelize.query(`DELETE FROM cash_cuts WHERE date = '${testDate}'`);

        console.log(`🧪 Testing Email Automation for date ${testDate}...`);

        // TEST 1: First Run - Should Send
        console.log('\n--- Run 1: Should Send ---');
        const res1 = await processDailyCutEmail({ date: testDate, email: 'test@example.com' });
        console.log('Result 1:', res1);

        if (res1.ok && sendMailMock.sent.length === 1) {
            console.log('✅ Run 1 Passed: Email sent.');
        } else {
            console.error('Sent count:', sendMailMock.sent.length);
            throw new Error('Run 1 Failed: Email not sent or Result not OK');
        }

        // TEST 2: Second Run - Deduplication (Idempotency)
        console.log('\n--- Run 2: Should Skip (Dedupe) ---');
        const res2 = await processDailyCutEmail({ date: testDate, email: 'test@example.com' });
        console.log('Result 2:', res2);

        if (res2.ok && res2.skipped && sendMailMock.sent.length === 1) {
            console.log('✅ Run 2 Passed: Email skipped (count remains 1).');
        } else {
            console.error('Sent count:', sendMailMock.sent.length);
            throw new Error('Run 2 Failed: Deduplication logic not working');
        }

    } catch (e) {
        console.error('❌ Test Failed:', e);
        process.exit(1);
    } finally {
        await sequelize.close();
    }
};

runTest();
