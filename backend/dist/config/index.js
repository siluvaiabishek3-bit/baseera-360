"use strict";
/**
 * BASEERA 360 - Application Configuration
 * Centralized config management
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config();
const config = {
    // Server
    server: {
        nodeEnv: (process.env.NODE_ENV || 'development'),
        port: parseInt(process.env.PORT || '3000'),
        host: process.env.HOST || 'localhost',
    },
    // Database
    database: {
        url: process.env.DATABASE_URL || 'postgresql://baseera_app:password@localhost:5432/baseera_360',
        poolMax: parseInt(process.env.DATABASE_POOL_MAX || '20'),
        poolIdleTimeout: parseInt(process.env.DATABASE_POOL_IDLE_TIMEOUT || '30000'),
        connectionTimeout: 2000,
    },
    // JWT & Auth
    auth: {
        jwtSecret: process.env.JWT_SECRET || 'change-me-in-production',
        jwtExpiry: process.env.JWT_EXPIRY || '7d',
        bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '10'),
    },
    // Storage
    storage: {
        type: (process.env.STORAGE_TYPE || 'local'),
        bucket: process.env.STORAGE_BUCKET || 'baseera-360-uploads',
        awsRegion: process.env.AWS_REGION || 'us-east-1',
        awsAccessKey: process.env.AWS_ACCESS_KEY_ID,
        awsSecretKey: process.env.AWS_SECRET_ACCESS_KEY,
        localPath: path_1.default.join(process.cwd(), 'uploads'),
    },
    // CDN
    cdn: {
        url: process.env.CDN_URL || 'https://cdn.baseera.ae',
        thumbnailSize: process.env.THUMBNAIL_SIZE || '200x200',
    },
    // Email
    email: {
        smtpHost: process.env.SMTP_HOST || 'smtp.gmail.com',
        smtpPort: parseInt(process.env.SMTP_PORT || '587'),
        smtpUser: process.env.SMTP_USER,
        smtpPassword: process.env.SMTP_PASSWORD,
        fromEmail: process.env.NOTIFICATION_FROM_EMAIL || 'noreply@baseera.ae',
    },
    // Logging
    logging: {
        level: process.env.LOG_LEVEL || 'info',
        file: process.env.LOG_FILE || 'logs/app.log',
    },
    // CORS
    cors: {
        origin: (process.env.CORS_ORIGIN || 'http://localhost:3001').split(','),
    },
    // Feature Flags
    features: {
        thermalAnalysis: process.env.ENABLE_THERMAL_ANALYSIS === 'true',
        model3d: process.env.ENABLE_3D_VIEWER === 'true',
        panorama360: process.env.ENABLE_360_PANORAMA === 'true',
        gis: process.env.ENABLE_GIS === 'true',
    },
    // Rate Limiting
    rateLimiting: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
        maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
    },
    // API Documentation
    apiDocs: {
        enabled: process.env.API_DOCS_ENABLED === 'true',
        url: process.env.API_DOCS_URL || '/api/docs',
    },
};
exports.default = config;
//# sourceMappingURL=index.js.map