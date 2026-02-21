/**
 * Async Handler Wrapper
 * Eliminates the need for try/catch blocks in every controller.
 * Passes any thrown error to the next() middleware (Global Error Handler).
 */
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
