/**
 * BASEERA 360 - Health Check Routes
 */

import { Router, Request, Response } from 'express';
import db from '@/config/database';
import logger from '@/config/logger';

const router = Router();

/**
 * GET /api/health
 * Check API health status
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const dbHealth = await db.healthCheck();

    const health = {
      status: dbHealth.status === 'connected' ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: dbHealth.status,
      memory: {
        heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      },
    };

    const statusCode = health.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(health);
  } catch (error) {
    logger.error('Health check error', error);
    res.status(503).json({
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
