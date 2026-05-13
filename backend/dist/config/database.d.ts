/**
 * BASEERA 360 - Database Module
 * PostgreSQL connection pool and query utilities
 */
import { Pool, QueryResult, Client } from 'pg';
/**
 * Execute a query with automatic retry logic
 */
export declare function query<T = unknown>(text: string, params?: unknown[], retries?: number): Promise<QueryResult<T>>;
/**
 * Get a client for transaction management
 */
export declare function getClient(): Promise<Client>;
/**
 * Execute multiple queries in a transaction
 */
export declare function transaction<T>(callback: (client: Client) => Promise<T>): Promise<T>;
/**
 * Health check for database connection
 */
export declare function healthCheck(): Promise<{
    status: 'connected' | 'error';
    message: string;
}>;
/**
 * Close the connection pool
 */
export declare function closePool(): Promise<void>;
declare const _default: {
    pool: Pool;
    query: typeof query;
    getClient: typeof getClient;
    transaction: typeof transaction;
    healthCheck: typeof healthCheck;
    closePool: typeof closePool;
};
export default _default;
//# sourceMappingURL=database.d.ts.map