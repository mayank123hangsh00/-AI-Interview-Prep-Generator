import { createError } from './errorHandler.js';
/**
 * Middleware factory that validates request body against a Zod schema.
 */
export function validate(schema) {
    return (req, _res, next) => {
        const result = schema.safeParse(req.body);
        if (!result.success) {
            const messages = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
            next(createError(400, `Validation failed: ${messages.join('; ')}`, 'VALIDATION_ERROR'));
            return;
        }
        req.body = result.data;
        next();
    };
}
//# sourceMappingURL=validate.js.map