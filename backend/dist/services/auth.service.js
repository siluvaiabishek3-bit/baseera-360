"use strict";
/**
 * BASEERA 360 - Authentication Service
 * Handles user registration, login, and JWT token generation
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_1 = require("@/config/database");
const config_1 = __importDefault(require("@/config"));
const logger_1 = __importDefault(require("@/config/logger"));
const error_handler_1 = require("@/middleware/error-handler");
class AuthService {
    /**
     * Register a new user
     */
    async register(data) {
        logger_1.default.info('Registering new user', { email: data.email });
        // Validate input
        if (!data.email || !data.password || !data.firstName || !data.lastName) {
            throw new error_handler_1.ValidationError('All fields required: email, password, firstName, lastName');
        }
        if (data.password.length < 8) {
            throw new error_handler_1.ValidationError('Password must be at least 8 characters');
        }
        // Check if user already exists
        const existingResult = await (0, database_1.query)('SELECT id FROM users WHERE email = $1 AND deleted_at IS NULL', [data.email.toLowerCase()]);
        if (existingResult.rows.length > 0) {
            throw new error_handler_1.ConflictError(`Email ${data.email} is already registered`);
        }
        // Hash password
        let passwordHash;
        try {
            passwordHash = await bcrypt_1.default.hash(data.password, config_1.default.auth.bcryptRounds);
        }
        catch (error) {
            logger_1.default.error('Password hashing failed', error);
            throw new Error('Failed to hash password');
        }
        // Create user in transaction
        const user = await (0, database_1.transaction)(async (client) => {
            const result = await client.query(`INSERT INTO users (
          email, password_hash, first_name, last_name, organization_id, role, is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id, email, first_name, last_name, role, organization_id, is_active, created_at`, [
                data.email.toLowerCase(),
                passwordHash,
                data.firstName,
                data.lastName,
                data.organizationId || null,
                'VIEWER', // Default role for new users
                true,
            ]);
            if (result.rows.length === 0) {
                throw new Error('Failed to create user');
            }
            return result.rows[0];
        });
        // Generate token
        const token = this.generateToken({
            id: user.id,
            email: user.email,
            role: user.role,
            organizationId: user.organization_id,
        });
        // Format response
        const responseUser = {
            id: user.id,
            email: user.email,
            firstName: user.first_name,
            lastName: user.last_name,
            role: user.role,
            organizationId: user.organization_id,
            isActive: user.is_active,
            createdAt: user.created_at,
        };
        logger_1.default.info('User registered successfully', { userId: user.id, email: user.email });
        return { user: responseUser, token };
    }
    /**
     * Login user
     */
    async login(email, password) {
        logger_1.default.info('User login attempt', { email });
        if (!email || !password) {
            throw new error_handler_1.ValidationError('Email and password are required');
        }
        // Find user
        const result = await (0, database_1.query)(`SELECT id, email, password_hash, first_name, last_name, role, 
              organization_id, is_active, created_at 
       FROM users 
       WHERE email = $1 AND deleted_at IS NULL`, [email.toLowerCase()]);
        if (result.rows.length === 0) {
            logger_1.default.warn('Login failed: user not found', { email });
            throw new error_handler_1.ValidationError('Invalid email or password');
        }
        const userRecord = result.rows[0];
        // Check if user is active
        if (!userRecord.is_active) {
            logger_1.default.warn('Login failed: user inactive', { email, userId: userRecord.id });
            throw new error_handler_1.ValidationError('User account is inactive');
        }
        // Verify password
        let passwordValid;
        try {
            passwordValid = await bcrypt_1.default.compare(password, userRecord.password_hash);
        }
        catch (error) {
            logger_1.default.error('Password verification failed', error);
            throw new Error('Authentication failed');
        }
        if (!passwordValid) {
            logger_1.default.warn('Login failed: invalid password', { email });
            throw new error_handler_1.ValidationError('Invalid email or password');
        }
        // Update last login timestamp
        try {
            await (0, database_1.query)('UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1', [
                userRecord.id,
            ]);
        }
        catch (error) {
            logger_1.default.warn('Failed to update last_login_at', error);
            // Don't fail the login if this fails
        }
        // Generate token
        const token = this.generateToken({
            id: userRecord.id,
            email: userRecord.email,
            role: userRecord.role,
            organizationId: userRecord.organization_id,
        });
        // Format response
        const user = {
            id: userRecord.id,
            email: userRecord.email,
            firstName: userRecord.first_name,
            lastName: userRecord.last_name,
            role: userRecord.role,
            organizationId: userRecord.organization_id,
            isActive: userRecord.is_active,
            createdAt: userRecord.created_at,
        };
        logger_1.default.info('User logged in successfully', { userId: userRecord.id, email });
        return { user, token };
    }
    /**
     * Generate JWT token
     */
    generateToken(payload) {
        return jsonwebtoken_1.default.sign(payload, config_1.default.auth.jwtSecret, {
            expiresIn: config_1.default.auth.jwtExpiry,
        });
    }
    /**
     * Verify JWT token
     */
    verifyToken(token) {
        try {
            return jsonwebtoken_1.default.verify(token, config_1.default.auth.jwtSecret);
        }
        catch (error) {
            throw new error_handler_1.ValidationError('Invalid or expired token');
        }
    }
    /**
     * Get user by ID
     */
    async getUserById(userId) {
        const result = await (0, database_1.query)(`SELECT id, email, first_name, last_name, role, organization_id, is_active, created_at
       FROM users
       WHERE id = $1 AND deleted_at IS NULL`, [userId]);
        if (result.rows.length === 0) {
            throw new error_handler_1.NotFoundError(`User ${userId} not found`);
        }
        const user = result.rows[0];
        return {
            id: user.id,
            email: user.email,
            firstName: user.first_name,
            lastName: user.last_name,
            role: user.role,
            organizationId: user.organization_id,
            isActive: user.is_active,
            createdAt: user.created_at,
        };
    }
    /**
     * Refresh JWT token
     */
    refreshToken(userId) {
        return this.generateToken({ id: userId });
    }
}
exports.AuthService = AuthService;
exports.default = new AuthService();
//# sourceMappingURL=auth.service.js.map