/**
 * BASEERA 360 - Application Configuration
 * Centralized config management
 */
declare const config: {
    server: {
        nodeEnv: "development" | "production" | "test";
        port: number;
        host: string;
    };
    database: {
        url: string;
        poolMax: number;
        poolIdleTimeout: number;
        connectionTimeout: number;
    };
    auth: {
        jwtSecret: string;
        jwtExpiry: string;
        bcryptRounds: number;
    };
    storage: {
        type: "local" | "s3" | "azure";
        bucket: string;
        awsRegion: string;
        awsAccessKey: string | undefined;
        awsSecretKey: string | undefined;
        localPath: string;
    };
    cdn: {
        url: string;
        thumbnailSize: string;
    };
    email: {
        smtpHost: string;
        smtpPort: number;
        smtpUser: string | undefined;
        smtpPassword: string | undefined;
        fromEmail: string;
    };
    logging: {
        level: string;
        file: string;
    };
    cors: {
        origin: string[];
    };
    features: {
        thermalAnalysis: boolean;
        model3d: boolean;
        panorama360: boolean;
        gis: boolean;
    };
    rateLimiting: {
        windowMs: number;
        maxRequests: number;
    };
    apiDocs: {
        enabled: boolean;
        url: string;
    };
};
export default config;
//# sourceMappingURL=index.d.ts.map