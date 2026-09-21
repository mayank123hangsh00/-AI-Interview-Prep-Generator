import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { createError } from './errorHandler.js';

export interface AuthRequest extends Request {
  userId?: string;
}

interface JWTPayload {
  userId: string;
  iat: number;
  exp: number;
}

export function authMiddleware(req: AuthRequest, _res: Response, next: NextFunction): void {
  try {
    // Get token from cookie or Authorization header
    const token = req.cookies?.token || req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      throw createError(401, 'Authentication required', 'AUTH_REQUIRED');
    }

    const decoded = jwt.verify(token, env.JWT_SECRET) as JWTPayload;
    req.userId = decoded.userId;
    next();
  } catch (error: any) {
    if (error.name === 'JsonWebTokenError') {
      next(createError(401, 'Invalid token', 'INVALID_TOKEN'));
    } else if (error.name === 'TokenExpiredError') {
      next(createError(401, 'Token expired', 'TOKEN_EXPIRED'));
    } else {
      next(error);
    }
  }
}
