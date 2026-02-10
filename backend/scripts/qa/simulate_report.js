const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const nodemailer = require('nodemailer'); // Require the module to patch it
const { sequelize, CashCut, User, Branch } = require('../../models');

// 1. Mock Nodemailer GLOBALLY so any service using 'require("nodemailer")' gets this
const realCreateTransport = nodemailer.createTransport;
nodemailer.createTransport = (opts) => {
    return {
        sendMail: async (mailOptions) => {
            console.log('\n📧 --- [MOCK SMTP] SENDING EMAIL ---');
            console.log(`To: ${mailOptions.to}`);
            console.log(`Subject: ${mailOptions.subject}`);
            console.log('--- CONTENT START ---');
            // Log first 500 chars of HTML to verify content
            console.log(mailOptions.html ? mailOptions.html.substring(0, 500) + '...' : 'No HTML Content');
            console.log('--- CONTENT END ---');
            return { messageId: 'mock-simulation-id' };
        }
    };
};

const { processDailyCutEmail } = require('../../services/dailyCutEmailService');

async function runSimulation() {
    try {
        console.log("🚀 Starting Report Simulation...");
        await sequelize.authenticate();

        // Ensure models are synced enough
        // const { CashCut } = require('../../models'); 

        const TEST_DATE = '2025-10-10'; // Future date
        const TARGET_EMAIL = 'mariomoguel05@gmail.com';

        // 1. Setup Mock Data (CashCut)
        // Ensure we have a user and branch
        const user = await User.findOne();
        const branch = await Branch.findOne();

        if (!user || !branch) {
            console.error("❌ Need at least 1 user and 1 branch to simulate.");
            process.exit(1);
        }

        // Clean previous test
        await CashCut.destroy({ where: { date: TEST_DATE } });

        // Create dummy CashCut w/ totalIncome
        await CashCut.create({
            tenantId: user.tenantId,
            branchId: branch.id,
            openedByUserId: user.id,
            date: TEST_DATE,
            totalSystem: 5000,
            totalIncome: 1500, // Cash
            totalExpenses: 200,
            finalBalance: 1300,
            status: 'Closed',
            cutTime: new Date()
        });

        console.log(`✅ Created Mock CashCut for ${TEST_DATE}`);

        // 2. Trigger Process
        console.log(`📨 Triggering processDailyCutEmail for ${TARGET_EMAIL}...`);
        const result = await processDailyCutEmail({ date: TEST_DATE, email: TARGET_EMAIL });

        console.log("Result:", result);

        if (result.ok) {
            console.log("✅ SUCCESS: Simulation completed.");
        } else {
            console.error("❌ FAILURE:", result.error);
        }

    } catch (e) {
        console.error("❌ Critical Error:", e);
    } finally {
        await sequelize.close();
    }
}

runSimulation();
