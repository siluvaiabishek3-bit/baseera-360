/**
 * BASEERA 360 - Authentication Middleware
 * JWT token verification and user context attachment
 */
import { Request, Response, NextFunction } from 'express';
declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
                email: string;
                role: string;
                organizationId?: string;
            };
        }
    }
}
/**
 * Verify JWT token and attach user to request
 */
export declare function authenticate(req: Request, res: Response, next: NextFunction): void;
/**
 * Optional authentication - don't fail if token is invalid
 */
export declare function optionalAuth(req: Request, res: Response, next: NextFunction): void;
/**
 * Check if user has required role
 */
export declare function authorize(...requiredRoles: string[]): (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=auth.d.ts.map