/**
 * BASEERA 360 - Request Logger & Rate Limiter Middleware
 */
import { Request, Response, NextFunction } from 'express';
/**
 * Log incoming requests and outgoing responses
 */
export declare function requestLogger(req: Request, res: Response, next: NextFunction): void;
/**
 * Simple in-memory rate limiter
 * For production, use Redis instead
 */
export declare function rateLimiter(req: Request, res: Response, next: NextFunction): void;
//# sourceMappingURL=request-logger.d.ts.map