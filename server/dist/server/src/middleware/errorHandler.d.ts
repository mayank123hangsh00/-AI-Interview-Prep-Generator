import { Request, Response, NextFunction } from 'express';
export interface AppError extends Error {
    statusCode?: number;
    code?: string;
}
export declare function errorHandler(err: AppError, _req: Request, res: Response, _next: NextFunction): void;
/** Helper to create typed errors */
export declare function createError(statusCode: number, message: string, code?: string): AppError;
