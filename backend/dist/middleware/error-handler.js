"use strict";
/**
 * BASEERA 360 - Error Handler Middleware
 * Centralized error handling for all endpoints
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InternalError = exports.ConflictError = exports.NotFoundError = exports.AuthorizationError = exports.ValidationError = void 0;
exports.errorHandler = errorHandler;
const logger_1 = __importDefault(require("@/config/logger"));
const config_1 = __importDefault(require("@/config"));
/**
 * Global error handler
 */
function errorHandler(err, req, res, next) {
    const statusCode = err.statusCode || 500;
    const code = err.code || 'INTERNAL_ERROR';
    const message = err.message || 'An unexpected error occurred';
    // Log error
    if (statusCode >= 500) {
        logger_1.default.error('Server error', {
            message,
            code,
            statusCode,
            stack: err.stack,
            path: req.path,
            method: req.method,
            user: req.user?.id,
        });
    }
    else if (statusCode >= 400) {
        logger_1.default.warn('Client error', {
            message,
            code,
            statusCode,
            path: req.path,
            method: req.method,
            user: req.user?.id,
        });
    }
    // Response
    res.status(statusCode).json({
        success: false,
        error: {
            code,
            message,
            ...(config_1.default.server.nodeEnv === 'development' && { details: err.details, stack: err.stack }),
        },
    });
}
/**
 * Validation error helper
 */
class ValidationError extends Error {
    constructor(message, details) {
        super(message);
        this.details = details;
        this.statusCode = 400;
        this.code = 'VALIDATION_ERROR';
        this.name = 'ValidationError';
    }
}
exports.ValidationError = ValidationError;
/**
 * Authorization error helper
 */
class AuthorizationError extends Error {
    constructor(message = 'Access denied') {
        super(message);
        this.statusCode = 403;
        this.code = 'FORBIDDEN';
        this.name = 'AuthorizationError';
    }
}
exports.AuthorizationError = AuthorizationError;
/**
 * Not found error helper
 */
class NotFoundError extends Error {
    constructor(message) {
        super(message);
        this.statusCode = 404;
        this.code = 'NOT_FOUND';
        this.name = 'NotFoundError';
    }
}
exports.NotFoundError = NotFoundError;
/**
 * Conflict error helper
 */
class ConflictError extends Error {
    constructor(message) {
        super(message);
        this.statusCode = 409;
        this.code = 'CONFLICT';
        this.name = 'ConflictError';
    }
}
exports.ConflictError = ConflictError;
/**
 * Internal server error helper
 */
class InternalError extends Error {
    constructor(message = 'Internal server error', details) {
        super(message);
        this.details = details;
        this.statusCode = 500;
        this.code = 'INTERNAL_ERROR';
        this.name = 'InternalError';
    }
}
exports.InternalError = InternalError;
//# sourceMappingURL=error-handler.js.map