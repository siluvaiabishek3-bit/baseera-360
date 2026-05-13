/**
 * BASEERA 360 - Error Handler Middleware
 * Centralized error handling for all endpoints
 */

import { Request, Response, NextFunction } from 'express';
import logger from '@/config/logger';
import config from '@/config';

export interface ApiError extends Error {
  statusCode?: number;
  code?: string;
  details?: unknown;
}

/**
 * Global error handler
 */
export function errorHandler(err: ApiError, req: Request, res: Response, next: NextFunction): void {
  const statusCode = err.statusCode || 500;
  const code = err.code || 'INTERNAL_ERROR';
  const message = err.message || 'An unexpected error occurred';

  // Log error
  if (statusCode >= 500) {
    logger.error('Server error', {
      message,
      code,
      statusCode,
      stack: err.stack,
      path: req.path,
      method: req.method,
      user: req.user?.id,
    });
  } else if (statusCode >= 400) {
    logger.warn('Client error', {
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
      ...(config.server.nodeEnv === 'development' && { details: err.details, stack: err.stack }),
    },
  });
}

/**
 * Validation error helper
 */
export class ValidationError extends Error implements ApiError {
  statusCode = 400;
  code = 'VALIDATION_ERROR';

  constructor(message: string, public details?: unknown) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Authorization error helper
 */
export class AuthorizationError extends Error implements ApiError {
  statusCode = 403;
  code = 'FORBIDDEN';

  constructor(message: string = 'Access denied') {
    super(message);
    this.name = 'AuthorizationError';
  }
}

/**
 * Not found error helper
 */
export class NotFoundError extends Error implements ApiError {
  statusCode = 404;
  code = 'NOT_FOUND';

  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

/**
 * Conflict error helper
 */
export class ConflictError extends Error implements ApiError {
  statusCode = 409;
  code = 'CONFLICT';

  constructor(message: string) {
    super(message);
    this.name = 'ConflictError';
  }
}

/**
 * Internal server error helper
 */
export class InternalError extends Error implements ApiError {
  statusCode = 500;
  code = 'INTERNAL_ERROR';

  constructor(message: string = 'Internal server error', public details?: unknown) {
    super(message);
    this.name = 'InternalError';
  }
}
