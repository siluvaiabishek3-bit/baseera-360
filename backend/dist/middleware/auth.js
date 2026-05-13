"use strict";
/**
 * BASEERA 360 - Authentication Middleware
 * JWT token verification and user context attachment
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = authenticate;
exports.optionalAuth = optionalAuth;
exports.authorize = authorize;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = __importDefault(require("@/config"));
const logger_1 = __importDefault(require("@/config/logger"));
/**
 * Verify JWT token and attach user to request
 */
function authenticate(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({
                success: false,
                error: {
                    code: 'UNAUTHORIZED',
                    message: 'Missing or invalid authorization header',
                },
            });
            return;
        }
        const token = authHeader.substring(7); // Remove "Bearer " prefix
        try {
            const decoded = jsonwebtoken_1.default.verify(token, config_1.default.auth.jwtSecret);
            req.user = decoded;
            next();
        }
        catch (error) {
            if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
                res.status(401).json({
                    success: false,
                    error: {
                        code: 'TOKEN_EXPIRED',
                        message: 'JWT token has expired',
                    },
                });
            }
            else if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
                res.status(401).json({
                    success: false,
                    error: {
                        code: 'INVALID_TOKEN',
                        message: 'Invalid JWT token',
                    },
                });
            }
            else {
                throw error;
            }
        }
    }
    catch (error) {
        logger_1.default.error('Authentication error', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Authentication failed',
            },
        });
    }
}
/**
 * Optional authentication - don't fail if token is invalid
 */
function optionalAuth(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            next();
            return;
        }
        const token = authHeader.substring(7);
        try {
            const decoded = jsonwebtoken_1.default.verify(token, config_1.default.auth.jwtSecret);
            req.user = decoded;
        }
        catch (error) {
            logger_1.default.debug('Optional auth: invalid token', error);
        }
        next();
    }
    catch (error) {
        logger_1.default.error('Optional authentication error', error);
        next();
    }
}
/**
 * Check if user has required role
 */
function authorize(...requiredRoles) {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({
                success: false,
                error: {
                    code: 'UNAUTHORIZED',
                    message: 'User not authenticated',
                },
            });
            return;
        }
        if (!requiredRoles.includes(req.user.role)) {
            res.status(403).json({
                success: false,
                error: {
                    code: 'FORBIDDEN',
                    message: `User role '${req.user.role}' is not authorized. Required: ${requiredRoles.join(', ')}`,
                },
            });
            return;
        }
        next();
    };
}
//# sourceMappingURL=auth.js.map