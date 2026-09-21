import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { createError } from './errorHandler.js';
export function authMiddleware(req, _res, next) {
    try {
        // Get token from cookie or Authorization header
        const token = req.cookies?.token || req.headers.authorization?.replace('Bearer ', '');
        if (!token) {
            throw createError(401, 'Authentication required', 'AUTH_REQUIRED');
        }
        const decoded = jwt.verify(token, env.JWT_SECRET);
        req.userId = decoded.userId;
        next();
    }
    catch (error) {
        if (error.name === 'JsonWebTokenError') {
            next(createError(401, 'Invalid token', 'INVALID_TOKEN'));
        }
        else if (error.name === 'TokenExpiredError') {
            next(createError(401, 'Token expired', 'TOKEN_EXPIRED'));
        }
        else {
            next(error);
        }
    }
}
//# sourceMappingURL=auth.js.map