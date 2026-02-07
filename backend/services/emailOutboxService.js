const { EmailQueue } = require('../models');

// ✅ Add to Queue (Async Producer)
exports.addToQueue = async ({ tenantId = null, to, subject, html, text = null, meta = null }) => {
    try {
        if (!to || !subject || !html) {
            throw new Error('Missing required fields: to, subject, html');
        }

        const email = await EmailQueue.create({
            tenantId,
            to,
            subject,
            html,
            text,
            meta,
            status: 'PENDING',
            attempts: 0,
            maxAttempts: 3,
            nextAttemptAt: new Date() // Send immediately
        });

        return { success: true, id: email.id };
    } catch (e) {
        console.error('EmailOutboxService Error:', e);
        // We throw here because failing to queue an email is usually a system error
        // that the caller should know about (or catch).
        throw e;
    }
};

// Wrapper for backward compatibility if needed
exports.sendMail = async (params) => {
    return exports.addToQueue(params);
};
