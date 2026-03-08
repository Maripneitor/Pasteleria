const logger = require('../../utils/logger');

/**
 * Global Error Handler Middleware
 * Catches all errors and returns a consistent JSON response.
 */
const errorHandler = (err, req, res, next) => {
    const requestId = req.requestId || 'unknown';

    // Log the error with all available metadata
    logger.error('Unhandled Exception at RequestID: %s | URL: %s', requestId, req.originalUrl, {
        message: err.message,
        stack: err.stack,
        code: err.code || 'UNKNOWN',
        status: err.status || err.statusCode || 500
    });

    const statusCode = err.statusCode || err.status || 500;

    res.status(statusCode).json({
        ok: false,
        code: err.code || 'INTERNAL_ERROR',
        message: err.message || 'Algo salió mal en el servidor',
        requestId
    });
};

module.exports = errorHandler;
