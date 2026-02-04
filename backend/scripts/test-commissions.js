const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';
// We assume there is logic to get a token, but for now we might need to bypass auth or assume dev environment allows it?
// The prompt implies we should test "endpoints", but `commissionRoutes` uses `authMiddleware`.
// If I cannot easily get a token, I might need to mock or temporarily disable auth for local testing, 
// OR simpler: create a script that IMPORTS the service directly and tests the logic without HTTP overhead.
// The prompt said: "POST /api/commissions/trigger-report (For Testing Outbox)".
// Let's try to test the SERVICES directly first to ensure logic is sound, 
// then if possible test routes. Testing routes requires a running server and valid auth.
// Given strict instructions not to modify secrets or production files, disabling auth is risky.
// BETTER APPROACH: Test the SERVICES directly in this script.

const { createCommission, getReport } = require('../services/commissionService');
const { enqueueDailyReport } = require('../services/emailOutboxService');
const { sequelize } = require('../config/database');

const runTests = async () => {
    try {
        console.log("🔌 Connecting to DB...");
        await sequelize.authenticate();
        console.log("✅ DB Connected.");

        // Clean up test data if needed? Or just ignore.
        // Let's create unique folios
        const folio1 = `TEST-${Date.now()}-1`;
        const folio2 = `TEST-${Date.now()}-2`;

        console.log(`\n🧪 Testing createCommission (Applied)...`);
        const comm1 = await createCommission({
            folioNumber: folio1,
            total: 100,
            appliedToCustomer: true,
            terminalId: 'T1'
        });
        console.log(`Result: Amount=${comm1.amount}, Rounded=${comm1.roundedAmount}, CreatedAt=${comm1.createdAt}`);
        if (parseFloat(comm1.amount) === 5.00 && parseFloat(comm1.roundedAmount) === 5.00) {
            console.log("✅ Commission 1 Correct");
        } else {
            console.error("❌ Commission 1 Incorrect");
        }

        console.log(`\n🧪 Testing createCommission (Not Applied)...`);
        const comm2 = await createCommission({
            folioNumber: folio2,
            total: 105,
            appliedToCustomer: false,
            terminalId: 'T1'
        });
        // 105 * 0.05 = 5.25. Rounded would be 5.25 (if 2 decimals).
        console.log(`Result: Amount=${comm2.amount}, Rounded=${comm2.roundedAmount}`);
        if (parseFloat(comm2.amount) === 5.25 && comm2.roundedAmount === null) {
            console.log("✅ Commission 2 Correct");
        } else {
            console.error("❌ Commission 2 Incorrect");
        }

        console.log(`\n🧪 Testing getReport...`);
        const today = new Date().toISOString().split('T')[0];
        const report = await getReport({ from: today, to: today });
        console.log("Report Summary:", {
            total: report.totalCommissions,
            applied: report.totalAppliedToCustomer,
            notApplied: report.totalNotApplied
        });

        // Validation (fuzzy because other items might exist today, but purely in this run...)
        // We at least expect to see our transactions.
        const found1 = report.details.find(d => d.folioNumber === folio1);
        const found2 = report.details.find(d => d.folioNumber === folio2);

        if (found1 && found2) {
            console.log("✅ Report includes test transactions");
        } else {
            console.error("❌ Report missing test transactions");
        }

        console.log(`\n🧪 Testing Email Outbox (Stub)...`);
        // We expect this to fail or warn if no SMTP, but it should typically return object
        const emailResult = await enqueueDailyReport({ date: today, to: 'test@example.com' });
        console.log("Email Result:", emailResult);

        console.log("\n✨ All Service Tests Completed.");
        process.exit(0);

    } catch (error) {
        console.error("❌ Test Failed:", error);
        process.exit(1);
    }
};

runTests();
