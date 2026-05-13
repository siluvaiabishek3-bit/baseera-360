/**
 * BASEERA 360 - Database Module
 * PostgreSQL connection pool and query utilities
 */

import { Pool, QueryResult, Client } from 'pg';
import logger from './logger';
import config from './index';

// Create connection pool
const pool = new Pool({
  connectionString: config.database.url,
  max: config.database.poolMax,
  idleTimeoutMillis: config.database.poolIdleTimeout,
  connectionTimeoutMillis: config.database.connectionTimeout,
});

pool.on('error', (err) => {
  logger.error('Unexpected error on idle client', err);
});

pool.on('connect', () => {
  logger.debug('New database connection established');
});

pool.on('remove', () => {
  logger.debug('Database connection removed from pool');
});

/**
 * Execute a query with automatic retry logic
 */
export async function query<T = unknown>(
  text: string,
  params?: unknown[],
  retries = 1
): Promise<QueryResult<T>> {
  try {
    return await pool.query<T>(text, params);
  } catch (error) {
    if (retries > 0 && isRetryableError(error)) {
      logger.warn(`Query failed, retrying... (${retries} attempts left)`);
      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, 100 * (2 - retries)));
      return query<T>(text, params, retries - 1);
    }
    logger.error('Database query error', { text, error });
    throw error;
  }
}

/**
 * Get a client for transaction management
 */
export async function getClient(): Promise<Client> {
  return pool.connect();
}

/**
 * Check if error is retryable (connection lost, timeout, etc.)
 */
function isRetryableError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  return (
    message.includes('econnrefused') ||
    message.includes('timeout') ||
    message.includes('terminating') ||
    message.includes('connection reset') ||
    message.includes('pool is shutting down')
  );
}

/**
 * Execute multiple queries in a transaction
 */
export async function transaction<T>(
  callback: (client: Client) => Promise<T>
): Promise<T> {
  const client = await getClient();

  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Health check for database connection
 */
export async function healthCheck(): Promise<{ status: 'connected' | 'error'; message: string }> {
  try {
    await pool.query('SELECT 1');
    return { status: 'connected', message: 'Database is healthy' };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { status: 'error', message };
  }
}

/**
 * Close the connection pool
 */
export async function closePool(): Promise<void> {
  await pool.end();
  logger.info('Database connection pool closed');
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  await closePool();
});

export default {
  pool,
  query,
  getClient,
  transaction,
  healthCheck,
  closePool,
};
