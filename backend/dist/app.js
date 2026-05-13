"use strict";
/**
 * BASEERA 360 - Express Application
 * Main application setup with middleware and routes
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startServer = startServer;
const express_1 = __importDefault(require("express"));
require("express-async-errors");
const cors_1 = __importDefault(require("cors"));
const logger_1 = __importDefault(require("@/config/logger"));
const config_1 = __importDefault(require("@/config"));
const database_1 = __importDefault(require("@/config/database"));
// Middleware
const error_handler_1 = require("@/middleware/error-handler");
const request_logger_1 = require("@/middleware/request-logger");
const rate_limiter_1 = require("@/middleware/rate-limiter");
const auth_1 = require("@/middleware/auth");
// Routes
const auth_2 = __importDefault(require("@/routes/auth"));
const projects_1 = __importDefault(require("@/routes/projects"));
const media_1 = __importDefault(require("@/routes/media"));
const annotations_1 = __importDefault(require("@/routes/annotations"));
const thermal_1 = __importDefault(require("@/routes/thermal"));
const panoramas_1 = __importDefault(require("@/routes/panoramas"));
const models_1 = __importDefault(require("@/routes/models"));
const reports_1 = __importDefault(require("@/routes/reports"));
const health_1 = __importDefault(require("@/routes/health"));
const app = (0, express_1.default)();
// ============================================================================
// MIDDLEWARE SETUP
// ============================================================================
// Trust proxy (for accurate IP addresses behind reverse proxy)
app.set('trust proxy', 1);
// CORS
app.use((0, cors_1.default)({
    origin: config_1.default.cors.origin,
    credentials: true,
    optionsSuccessStatus: 200,
}));
// Body parsing
app.use(express_1.default.json({ limit: '50mb' }));
app.use(express_1.default.urlencoded({ limit: '50mb', extended: true }));
// Request logging
app.use(request_logger_1.requestLogger);
// Rate limiting
app.use(rate_limiter_1.rateLimiter);
// ============================================================================
// ROUTES
// ============================================================================
// Health check (no auth required)
app.use('/api/health', health_1.default);
// Authentication routes (no auth required)
app.use('/api/auth', auth_2.default);
// Protected API routes (require authentication)
app.use('/api/projects', auth_1.authenticate, projects_1.default);
app.use('/api/media', auth_1.authenticate, media_1.default);
app.use('/api/annotations', auth_1.authenticate, annotations_1.default);
app.use('/api/thermal', auth_1.authenticate, thermal_1.default);
app.use('/api/panoramas', auth_1.authenticate, panoramas_1.default);
app.use('/api/models', auth_1.authenticate, models_1.default);
app.use('/api/reports', auth_1.authenticate, reports_1.default);
// ============================================================================
// ROOT ENDPOINT
// ============================================================================
app.get('/', (req, res) => {
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
app.use((req, res) => {
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
app.use(error_handler_1.errorHandler);
// ============================================================================
// EXPORTS
// ============================================================================
exports.default = app;
/**
 * Application startup and graceful shutdown
 */
async function startServer() {
    try {
        // Test database connection
        const dbHealth = await database_1.default.healthCheck();
        if (dbHealth.status !== 'connected') {
            throw new Error(`Database connection failed: ${dbHealth.message}`);
        }
        logger_1.default.info('Database connection successful');
        // Start HTTP server
        const server = app.listen(config_1.default.server.port, config_1.default.server.host, () => {
            logger_1.default.info(`🚀 Server running on http://${config_1.default.server.host}:${config_1.default.server.port}`);
            logger_1.default.info(`📚 API Docs: http://${config_1.default.server.host}:${config_1.default.server.port}/api/docs`);
        });
        // Graceful shutdown
        process.on('SIGTERM', async () => {
            logger_1.default.info('SIGTERM signal received: closing HTTP server');
            server.close(async () => {
                logger_1.default.info('HTTP server closed');
                await database_1.default.closePool();
                process.exit(0);
            });
        });
        process.on('SIGINT', async () => {
            logger_1.default.info('SIGINT signal received: closing HTTP server');
            server.close(async () => {
                logger_1.default.info('HTTP server closed');
                await database_1.default.closePool();
                process.exit(0);
            });
        });
    }
    catch (error) {
        logger_1.default.error('Failed to start server', error);
        process.exit(1);
    }
}
//# sourceMappingURL=app.js.map