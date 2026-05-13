/**
 * BASEERA 360 - Express Application
 * Main application setup with middleware and routes
 */

import express, { Express, Request, Response, NextFunction } from 'express';
import 'express-async-errors';
import cors from 'cors';
import logger from '@/config/logger';
import config from '@/config';
import db from '@/config/database';

// Middleware
import { errorHandler } from '@/middleware/error-handler';
import { requestLogger } from '@/middleware/request-logger';
import { rateLimiter } from '@/middleware/rate-limiter';
import { authenticate } from '@/middleware/auth';

// Routes
import authRoutes from '@/routes/auth';
import projectRoutes from '@/routes/projects';
import mediaRoutes from '@/routes/media';
import annotationRoutes from '@/routes/annotations';
import thermalRoutes from '@/routes/thermal';
import panoramaRoutes from '@/routes/panoramas';
import modelRoutes from '@/routes/models';
import reportRoutes from '@/routes/reports';
import healthRoutes from '@/routes/health';

const app: Express = express();

// ============================================================================
// MIDDLEWARE SETUP
// ============================================================================

// Trust proxy (for accurate IP addresses behind reverse proxy)
app.set('trust proxy', 1);

// CORS
app.use(
  cors({
    origin: config.cors.origin,
    credentials: true,
    optionsSuccessStatus: 200,
  })
);

// Body parsing
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Request logging
app.use(requestLogger);

// Rate limiting
app.use(rateLimiter);

// ============================================================================
// ROUTES
// ============================================================================

// Health check (no auth required)
app.use('/api/health', healthRoutes);

// Authentication routes (no auth required)
app.use('/api/auth', authRoutes);

// Protected API routes (require authentication)
app.use('/api/projects', authenticate, projectRoutes);
app.use('/api/media', authenticate, mediaRoutes);
app.use('/api/annotations', authenticate, annotationRoutes);
app.use('/api/thermal', authenticate, thermalRoutes);
app.use('/api/panoramas', authenticate, panoramaRoutes);
app.use('/api/models', authenticate, modelRoutes);
app.use('/api/reports', authenticate, reportRoutes);

// ============================================================================
// ROOT ENDPOINT
// ============================================================================

app.get('/', (req: Request, res: Response) => {
  res.json({
    name: 'BASEERA 360 - Facade Inspection API',
    version: '1.0.0',
    status: 'running',
    documentation: '/api/docs',
  });
});

// ============================================================================
// 404 HANDLER
// ============================================================================

app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
    },
  });
});

// ============================================================================
// ERROR HANDLING
// ============================================================================

app.use(errorHandler);

// ============================================================================
// EXPORTS
// ============================================================================

export default app;

/**
 * Application startup and graceful shutdown
 */
export async function startServer(): Promise<void> {
  try {
    // Test database connection
    const dbHealth = await db.healthCheck();
    if (dbHealth.status !== 'connected') {
      throw new Error(`Database connection failed: ${dbHealth.message}`);
    }
    logger.info('Database connection successful');

    // Start HTTP server
    const server = app.listen(config.server.port, config.server.host, () => {
      logger.info(`🚀 Server running on http://${config.server.host}:${config.server.port}`);
      logger.info(`📚 API Docs: http://${config.server.host}:${config.server.port}/api/docs`);
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      logger.info('SIGTERM signal received: closing HTTP server');
      server.close(async () => {
        logger.info('HTTP server closed');
        await db.closePool();
        process.exit(0);
      });
    });

    process.on('SIGINT', async () => {
      logger.info('SIGINT signal received: closing HTTP server');
      server.close(async () => {
        logger.info('HTTP server closed');
        await db.closePool();
        process.exit(0);
      });
    });
  } catch (error) {
    logger.error('Failed to start server', error);
    process.exit(1);
  }
}
