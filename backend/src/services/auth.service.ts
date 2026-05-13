/**
 * BASEERA 360 - Authentication Service
 * Handles user registration, login, and JWT token generation
 */

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { query, transaction } from '@/config/database';
import config from '@/config';
import logger from '@/config/logger';
import { ValidationError, ConflictError, NotFoundError } from '@/middleware/error-handler';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  organizationId?: string;
  isActive: boolean;
  createdAt: Date;
}

interface LoginResponse {
  user: User;
  token: string;
}

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  organizationId?: string;
}

export class AuthService {
  /**
   * Register a new user
   */
  async register(data: RegisterData): Promise<LoginResponse> {
    logger.info('Registering new user', { email: data.email });

    // Validate input
    if (!data.email || !data.password || !data.firstName || !data.lastName) {
      throw new ValidationError('All fields required: email, password, firstName, lastName');
    }

    if (data.password.length < 8) {
      throw new ValidationError('Password must be at least 8 characters');
    }

    // Check if user already exists
    const existingResult = await query<{ id: string }>(
      'SELECT id FROM users WHERE email = $1 AND deleted_at IS NULL',
      [data.email.toLowerCase()]
    );

    if (existingResult.rows.length > 0) {
      throw new ConflictError(`Email ${data.email} is already registered`);
    }

    // Hash password
    let passwordHash: string;
    try {
      passwordHash = await bcrypt.hash(data.password, config.auth.bcryptRounds);
    } catch (error) {
      logger.error('Password hashing failed', error);
      throw new Error('Failed to hash password');
    }

    // Create user in transaction
    const user = await transaction(async (client) => {
      const result = await client.query<any>(
        `INSERT INTO users (
          email, password_hash, first_name, last_name, organization_id, role, is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id, email, first_name, last_name, role, organization_id, is_active, created_at`,
        [
          data.email.toLowerCase(),
          passwordHash,
          data.firstName,
          data.lastName,
          data.organizationId || null,
          'VIEWER', // Default role for new users
          true,
        ]
      );

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
    const responseUser: User = {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
      organizationId: user.organization_id,
      isActive: user.is_active,
      createdAt: user.created_at,
    };

    logger.info('User registered successfully', { userId: user.id, email: user.email });

    return { user: responseUser, token };
  }

  /**
   * Login user
   */
  async login(email: string, password: string): Promise<LoginResponse> {
    logger.info('User login attempt', { email });

    if (!email || !password) {
      throw new ValidationError('Email and password are required');
    }

    // Find user
    const result = await query<any>(
      `SELECT id, email, password_hash, first_name, last_name, role, 
              organization_id, is_active, created_at 
       FROM users 
       WHERE email = $1 AND deleted_at IS NULL`,
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      logger.warn('Login failed: user not found', { email });
      throw new ValidationError('Invalid email or password');
    }

    const userRecord = result.rows[0];

    // Check if user is active
    if (!userRecord.is_active) {
      logger.warn('Login failed: user inactive', { email, userId: userRecord.id });
      throw new ValidationError('User account is inactive');
    }

    // Verify password
    let passwordValid: boolean;
    try {
      passwordValid = await bcrypt.compare(password, userRecord.password_hash);
    } catch (error) {
      logger.error('Password verification failed', error);
      throw new Error('Authentication failed');
    }

    if (!passwordValid) {
      logger.warn('Login failed: invalid password', { email });
      throw new ValidationError('Invalid email or password');
    }

    // Update last login timestamp
    try {
      await query('UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1', [
        userRecord.id,
      ]);
    } catch (error) {
      logger.warn('Failed to update last_login_at', error);
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
    const user: User = {
      id: userRecord.id,
      email: userRecord.email,
      firstName: userRecord.first_name,
      lastName: userRecord.last_name,
      role: userRecord.role,
      organizationId: userRecord.organization_id,
      isActive: userRecord.is_active,
      createdAt: userRecord.created_at,
    };

    logger.info('User logged in successfully', { userId: userRecord.id, email });

    return { user, token };
  }

  /**
   * Generate JWT token
   */
  private generateToken(payload: any): string {
    return jwt.sign(payload, config.auth.jwtSecret, {
      expiresIn: config.auth.jwtExpiry,
    });
  }

  /**
   * Verify JWT token
   */
  verifyToken(token: string): any {
    try {
      return jwt.verify(token, config.auth.jwtSecret);
    } catch (error) {
      throw new ValidationError('Invalid or expired token');
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<User> {
    const result = await query<any>(
      `SELECT id, email, first_name, last_name, role, organization_id, is_active, created_at
       FROM users
       WHERE id = $1 AND deleted_at IS NULL`,
      [userId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError(`User ${userId} not found`);
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
  refreshToken(userId: string): string {
    return this.generateToken({ id: userId });
  }
}

export default new AuthService();
