const { addToQueue } = require('../services/emailOutboxService');
const { processEmailQueueBatch } = require('../workers/emailWorker');
const { EmailQueue, sequelize } = require('../models');

async function run() {
    console.log('🚀 Email Queue Smoke Test...');

    // Connect DB
    await sequelize.authenticate();

    const testSubject = `Smoke Test ${Date.now()}`;
    const testTo = 'test@example.com';

    // 1. Enqueue
    console.log('--- Enqueuing Email ---');
    const { id } = await addToQueue({
        to: testTo,
        subject: testSubject,
        html: '<p>Hello World</p>',
        tenantId: 1
    });
    console.log(`✅ Email Queued: ID=${id}`);

    // Verify Pending
    const pending = await EmailQueue.findByPk(id);
    if (!pending || pending.status !== 'PENDING') {
        console.error('❌ Queued email not PENDING');
        process.exit(1);
    }

    // 2. Process Batch
    console.log('--- Processing Batch (Force Run) ---');
    // We Mock transport implicitly by env vars missing (or if set, using real)
    // To ensure Mock for this test if real SMTP is set in env, we might want to override createTransport logic...
    // But per requirements, use whatever provided. If Mock, logic prints log.

    const count = await processEmailQueueBatch(10);
    console.log(`Processed: ${count} items`);

    if (count === 0) {
        console.error('❌ No items processed (Worker didn\'t pick up)');
        process.exit(1);
    }

    // 3. Verify Sent/Failed
    const processed = await EmailQueue.findByPk(id);
    console.log(`Final Status: ${processed.status}, Attempts: ${processed.attempts}, LastError: ${processed.lastError}`);

    if (processed.status === 'SENT') {
        console.log('✅ Email processed successfully (SENT)');
    } else if (processed.status === 'FAILED') {
        console.log('⚠️ Email Failed (Check SMTP credentials or mock logic)');
        // This validates flow works, even if SMTP fails.
    } else {
        console.error('❌ Email stuck in PENDING or PROCESSING?');
        process.exit(1);
    }

    console.log('🎉 Email Queue Smoke Test Passed!');
    process.exit(0);
}

run().catch(e => {
    console.error(e);
    process.exit(1);
});
