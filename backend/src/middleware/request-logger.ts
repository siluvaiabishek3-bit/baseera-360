/**
 * BASEERA 360 - Request Logger & Rate Limiter Middleware
 */

import { Request, Response, NextFunction } from 'express';
import logger from '@/config/logger';
import config from '@/config';

// ============================================================================
// REQUEST LOGGER MIDDLEWARE
// ============================================================================

/**
 * Log incoming requests and outgoing responses
 */
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const startTime = Date.now();

  // Log request
  logger.debug(`Incoming ${req.method} ${req.path}`, {
    ip: req.ip,
    user: req.user?.id,
    query: req.query,
  });

  // Intercept response
  const originalSend = res.send;

  res.send = function (data: any) {
    const duration = Date.now() - startTime;

    logger.debug(`Response ${req.method} ${req.path}`, {
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      user: req.user?.id,
    });

    return originalSend.call(this, data);
  };

  next();
}

// ============================================================================
// RATE LIMITER MIDDLEWARE
// ============================================================================

interface RateLimitStore {
  [key: string]: { count: number; resetTime: number };
}

const rateLimitStore: RateLimitStore = {};

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
export function rateLimiter(req: Request, res: Response, next: NextFunction): void {
  const key = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();

  // Initialize or get rate limit data
  if (!rateLimitStore[key]) {
    rateLimitStore[key] = {
      count: 0,
      resetTime: now + config.rateLimiting.windowMs,
    };
  }

  const limit = rateLimitStore[key];

  // Reset if window has passed
  if (now > limit.resetTime) {
    limit.count = 0;
    limit.resetTime = now + config.rateLimiting.windowMs;
  }

  limit.count++;

  // Add rate limit headers
  res.setHeader('X-RateLimit-Limit', config.rateLimiting.maxRequests);
  res.setHeader('X-RateLimit-Remaining', Math.max(0, config.rateLimiting.maxRequests - limit.count));
  res.setHeader(
    'X-RateLimit-Reset',
    new Date(limit.resetTime).toISOString()
  );

  // Check limit
  if (limit.count > config.rateLimiting.maxRequests) {
    logger.warn(`Rate limit exceeded for IP: ${key}`);

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
