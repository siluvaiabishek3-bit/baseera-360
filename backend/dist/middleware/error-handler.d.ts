/**
 * BASEERA 360 - Error Handler Middleware
 * Centralized error handling for all endpoints
 */
import { Request, Response, NextFunction } from 'express';
export interface ApiError extends Error {
    statusCode?: number;
    code?: string;
    details?: unknown;
}
/**
 * Global error handler
 */
export declare function errorHandler(err: ApiError, req: Request, res: Response, next: NextFunction): void;
/**
 * Validation error helper
 */
export declare class ValidationError extends Error implements ApiError {
    details?: unknown | undefined;
    statusCode: number;
    code: string;
    constructor(message: string, details?: unknown | undefined);
}
/**
 * Authorization error helper
 */
export declare class AuthorizationError extends Error implements ApiError {
    statusCode: number;
    code: string;
    constructor(message?: string);
}
/**
 * Not found error helper
 */
export declare class NotFoundError extends Error implements ApiError {
    statusCode: number;
    code: string;
    constructor(message: string);
}
/**
 * Conflict error helper
 */
export declare class ConflictError extends Error implements ApiError {
    statusCode: number;
    code: string;
    constructor(message: string);
}
/**
 * Internal server error helper
 */
export declare class InternalError extends Error implements ApiError {
    details?: unknown | undefined;
    statusCode: number;
    code: string;
    constructor(message?: string, details?: unknown | undefined);
}
//# sourceMappingURL=error-handler.d.ts.map