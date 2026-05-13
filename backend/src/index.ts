/**
 * BASEERA 360 - Main Entry Point
 * Application initialization and server startup
 */

import app, { startServer } from './app';
import logger from './config/logger';
import config from './config';

// Log startup information
logger.info('🚀 Starting BASEERA 360 API Server');
logger.info(`Environment: ${config.server.nodeEnv}`);
logger.info(`Database: ${config.database.url.split('@')[1]}`);
logger.info(`Port: ${config.server.port}`);

// Start server
startServer().catch((error) => {
  logger.error('Failed to start server', error);
  process.exit(1);
});

export default app;
