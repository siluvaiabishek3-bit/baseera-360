"use strict";
/**
 * BASEERA 360 - Request Logger & Rate Limiter Middleware
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestLogger = requestLogger;
exports.rateLimiter = rateLimiter;
const logger_1 = __importDefault(require("@/config/logger"));
const config_1 = __importDefault(require("@/config"));
// ============================================================================
// REQUEST LOGGER MIDDLEWARE
// ============================================================================
/**
 * Log incoming requests and outgoing responses
 */
function requestLogger(req, res, next) {
    const startTime = Date.now();
    // Log request
    logger_1.default.debug(`Incoming ${req.method} ${req.path}`, {
        ip: req.ip,
        user: req.user?.id,
        query: req.query,
    });
    // Intercept response
    const originalSend = res.send;
    res.send = function (data) {
        const duration = Date.now() - startTime;
        logger_1.default.debug(`Response ${req.method} ${req.path}`, {
            statusCode: res.statusCode,
            duration: `${duration}ms`,
            user: req.user?.id,
        });
        return originalSend.call(this, data);
    };
    next();
}
const rateLimitStore = {};
// Clean up old entries every minute
setInterval(() => {
    const now = Date.now();
    Object.keys(rateLimitStore).forEach((key) => {
        if (rateLimitStore[key].resetTime < now) {
            delete rateLimitStore[key];
        }
    });
}, 60000);
/**
 * Simple in-memory rate limiter
 * For production, use Redis instead
 */
function rateLimiter(req, res, next) {
    const key = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    // Initialize or get rate limit data
    if (!rateLimitStore[key]) {
        rateLimitStore[key] = {
            count: 0,
            resetTime: now + config_1.default.rateLimiting.windowMs,
        };
    }
    const limit = rateLimitStore[key];
    // Reset if window has passed
    if (now > limit.resetTime) {
        limit.count = 0;
        limit.resetTime = now + config_1.default.rateLimiting.windowMs;
    }
    limit.count++;
    // Add rate limit headers
    res.setHeader('X-RateLimit-Limit', config_1.default.rateLimiting.maxRequests);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, config_1.default.rateLimiting.maxRequests - limit.count));
    res.setHeader('X-RateLimit-Reset', new Date(limit.resetTime).toISOString());
    // Check limit
    if (limit.count > config_1.default.rateLimiting.maxRequests) {
        logger_1.default.warn(`Rate limit exceeded for IP: ${key}`);
        res.status(429).json({
            success: false,
            error: {
                code: 'RATE_LIMIT_EXCEEDED',
                message: 'Too many requests, please try again later',
                retryAfter: Math.ceil((limit.resetTime - now) / 1000),
            },
        });
        return;
    }
    next();
}
//# sourceMappingURL=request-logger.js.map