const crypto = require('crypto');

const requestLogger = (req, res, next) => {
    // 1. Generate unique Request ID
    const requestId = crypto.randomUUID().split('-')[0]; // Shorten for readability
    req.requestId = requestId;
    res.setHeader('X-Request-ID', requestId);

    // 2. Debug Mode Check
    const isDebug = process.env.DEBUG_ORDER_FLOW === 'true';

    // 3. Log Basic Info
    // Only log essential info normally to keep logs clean
    if (isDebug) {
        console.group(`[Request ${requestId}] ${req.method} ${req.originalUrl}`);
        console.log(`User-Agent: ${req.get('user-agent')}`);

        if (Object.keys(req.body).length > 0) {
            // Sanitize sensitive fields
            const sanitizedBody = { ...req.body };
            ['password', 'token', 'creditCard'].forEach(k => {
                if (sanitizedBody[k]) sanitizedBody[k] = '***';
            });
            console.log('Body:', JSON.stringify(sanitizedBody, null, 2));
        }
        console.groupEnd();
    }

    // 4. Capture End for Timing (Optional but good)
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        if (isDebug || res.statusCode >= 400) {
            // Always log errors or slow requests if needed, but for now strict to logic
            const icon = res.statusCode >= 400 ? '❌' : '✅';
            if (isDebug) console.log(`[Response ${requestId}] ${icon} ${res.statusCode} (${duration}ms)`);
        }
    });

    next();
};

module.exports = requestLogger;
