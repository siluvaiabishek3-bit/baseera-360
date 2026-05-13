"use strict";
/**
 * BASEERA 360 - Database Module
 * PostgreSQL connection pool and query utilities
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.query = query;
exports.getClient = getClient;
exports.transaction = transaction;
exports.healthCheck = healthCheck;
exports.closePool = closePool;
const pg_1 = require("pg");
const logger_1 = __importDefault(require("./logger"));
const index_1 = __importDefault(require("./index"));
// Create connection pool
const pool = new pg_1.Pool({
    connectionString: index_1.default.database.url,
    max: index_1.default.database.poolMax,
    idleTimeoutMillis: index_1.default.database.poolIdleTimeout,
    connectionTimeoutMillis: index_1.default.database.connectionTimeout,
});
pool.on('error', (err) => {
    logger_1.default.error('Unexpected error on idle client', err);
});
pool.on('connect', () => {
    logger_1.default.debug('New database connection established');
});
pool.on('remove', () => {
    logger_1.default.debug('Database connection removed from pool');
});
/**
 * Execute a query with automatic retry logic
 */
async function query(text, params, retries = 1) {
    try {
        return await pool.query(text, params);
    }
    catch (error) {
        if (retries > 0 && isRetryableError(error)) {
            logger_1.default.warn(`Query failed, retrying... (${retries} attempts left)`);
            // Wait before retrying
            await new Promise((resolve) => setTimeout(resolve, 100 * (2 - retries)));
            return query(text, params, retries - 1);
        }
        logger_1.default.error('Database query error', { text, error });
        throw error;
    }
}
/**
 * Get a client for transaction management
 */
async function getClient() {
    return pool.connect();
}
/**
 * Check if error is retryable (connection lost, timeout, etc.)
 */
function isRetryableError(error) {
    if (!(error instanceof Error))
        return false;
    const message = error.message.toLowerCase();
    return (message.includes('econnrefused') ||
        message.includes('timeout') ||
        message.includes('terminating') ||
        message.includes('connection reset') ||
        message.includes('pool is shutting down'));
}
/**
 * Execute multiple queries in a transaction
 */
async function transaction(callback) {
    const client = await getClient();
    try {
        await client.query('BEGIN');
        const result = await callback(client);
        await client.query('COMMIT');
        return result;
    }
    catch (error) {
        await client.query('ROLLBACK');
        throw error;
    }
    finally {
        client.release();
    }
}
/**
 * Health check for database connection
 */
async function healthCheck() {
    try {
        await pool.query('SELECT 1');
        return { status: 'connected', message: 'Database is healthy' };
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return { status: 'error', message };
    }
}
/**
 * Close the connection pool
 */
async function closePool() {
    await pool.end();
    logger_1.default.info('Database connection pool closed');
}
// Handle graceful shutdown
process.on('SIGTERM', async () => {
    logger_1.default.info('SIGTERM signal received: closing HTTP server');
    await closePool();
});
exports.default = {
    pool,
    query,
    getClient,
    transaction,
    healthCheck,
    closePool,
};
//# sourceMappingURL=database.js.map