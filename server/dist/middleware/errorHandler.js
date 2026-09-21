export function errorHandler(err, _req, res, _next) {
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal server error';
    const code = err.code || 'INTERNAL_ERROR';
    console.error(`[${code}] ${message}`, err.stack);
    res.status(statusCode).json({
        error: {
            code,
            message: statusCode === 500 && process.env.NODE_ENV === 'production'
                ? 'Internal server error'
                : message,
        },
    });
}
/** Helper to create typed errors */
export function createError(statusCode, message, code) {
    const error = new Error(message);
    error.statusCode = statusCode;
    error.code = code;
    return error;
}
//# sourceMappingURL=errorHandler.js.map