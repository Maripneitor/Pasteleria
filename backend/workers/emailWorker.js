const { EmailQueue, sequelize } = require('../models');
const { Op } = require('sequelize');
const createTransport = require('../services/emailTransport');

const WORKER_INTERVAL_MS = Number(process.env.EMAIL_WORKER_INTERVAL_MS) || 30000;
const MAX_BATCH_SIZE = 10;
const FROM_EMAIL = process.env.SMTP_FROM || 'no-reply@localhost';

async function processEmailQueueBatch(limit = MAX_BATCH_SIZE) {
    const transport = createTransport();
    const now = new Date();

    // 1. Fetch Candidates
    // status IN ('PENDING', 'FAILED') AND attempts < maxAttempts AND nextAttemptAt <= now
    const candidates = await EmailQueue.findAll({
        where: {
            status: { [Op.in]: ['PENDING', 'FAILED'] },
            attempts: { [Op.lt]: sequelize.col('maxAttempts') },
            nextAttemptAt: { [Op.lte]: now }
        },
        order: [['nextAttemptAt', 'ASC']],
        limit
    });

    if (candidates.length === 0) return 0; // No work

    console.log(`📨 EmailWorker processing ${candidates.length} items...`);

    for (const email of candidates) {
        // Optimistic Locking / Status Reservation
        // Update status to PROCESSING to prevent double send
        // We use a direct update with where clause to ensure atomic check
        const [affectedRows] = await EmailQueue.update(
            { status: 'PROCESSING' },
            { where: { id: email.id, status: { [Op.in]: ['PENDING', 'FAILED'] } } }
        );

        if (affectedRows === 0) continue; // Logic race, skip

        try {
            // Send
            await transport.sendMail({
                from: FROM_EMAIL,
                to: email.to,
                subject: email.subject,
                html: email.html,
                text: email.text
            });

            // Success
            await email.update({
                status: 'SENT',
                sentAt: new Date(),
                lastError: null
            });

        } catch (error) {
            // Failure with Backoff
            const newAttempts = email.attempts + 1;
            console.error(`❌ Failed to send email ${email.id}:`, error.message);

            // Simple exponential backoff: 1min, 5min, 15min (approx)
            // attempt 1 -> add 1m
            // attempt 2 -> add 5m
            // attempt 3 -> add 15m
            let backoffMinutes = 1;
            if (newAttempts === 2) backoffMinutes = 5;
            if (newAttempts >= 3) backoffMinutes = 15;

            const nextRun = new Date(Date.now() + backoffMinutes * 60000);

            // Check max attempts
            const nextStatus = newAttempts >= email.maxAttempts ? 'FAILED' : 'FAILED';
            // We verify maxAttempts in the WHERE clause of fetch, so 'FAILED' status is effectively 'RETRY_LATER' until cap is hit.
            // But we keep it as FAILED or PENDING? Convention: FAILED means "last try failed". PENDING means "waiting first try".
            // Let's use FAILED for retryable errors too.

            await email.update({
                status: 'FAILED',
                attempts: newAttempts,
                lastError: error.message.substring(0, 1000),
                nextAttemptAt: nextRun
            });
        }
    }

    return candidates.length;
}

let timer = null;

function startEmailWorker() {
    if (process.env.EMAIL_WORKER_ENABLED !== 'true') {
        console.log('🚫 Email Worker DISABLED (Use EMAIL_WORKER_ENABLED=true to enable)');
        return;
    }

    console.log(`🚀 Email Worker STARTED (Interval: ${WORKER_INTERVAL_MS}ms)`);

    // Initial run
    processEmailQueueBatch().catch(console.error);

    // Loop
    timer = setInterval(() => {
        processEmailQueueBatch().catch(console.error);
    }, WORKER_INTERVAL_MS);
}

module.exports = {
    startEmailWorker,
    processEmailQueueBatch
};
