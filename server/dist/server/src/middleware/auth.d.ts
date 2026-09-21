import { Request, Response, NextFunction } from 'express';
export interface AuthRequest extends Request {
    userId?: string;
}
export declare function authMiddleware(req: AuthRequest, _res: Response, next: NextFunction): void;
