/**
 * BASEERA 360 - Authentication Routes
 * Login, register, logout, token refresh
 */

import { Router, Request, Response } from 'express';
import authService from '@/services/auth.service';
import { authenticate } from '@/middleware/auth';
import logger from '@/config/logger';

const router = Router();

/**
 * POST /api/auth/register
 * User registration
 */
router.post('/register', async (req: Request, res: Response) => {
  const { email, password, firstName, lastName, organizationId } = req.body;

  logger.info('Register endpoint hit', { email });

  const { user, token } = await authService.register({
    email,
    password,
    firstName,
    lastName,
    organizationId,
  });

  res.status(201).json({
    success: true,
    data: {
      user,
      token,
    },
  });
});

/**
 * POST /api/auth/login
 * User login
 */
router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;

  logger.info('Login endpoint hit', { email });

  const { user, token } = await authService.login(email, password);

  res.json({
    success: true,
    data: {
      user,
      token,
    },
  });
});

/**
 * POST /api/auth/refresh
 * Refresh JWT token
 */
router.post('/refresh', authenticate, async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'User not authenticated' },
    });
  }

  const token = authService.refreshToken(req.user.id);

  res.json({
    success: true,
    data: { token },
  });
});

/**
 * GET /api/auth/me
 * Get current user profile
 */
router.get('/me', authenticate, async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'User not authenticated' },
    });
  }

  const user = await authService.getUserById(req.user.id);

  res.json({
    success: true,
    data: { user },
  });
});

/**
 * POST /api/auth/logout
 * Logout (client-side token deletion)
 */
router.post('/logout', authenticate, (req: Request, res: Response) => {
  logger.info('User logout', { userId: req.user?.id });

  // Token is deleted on client side
  // Server doesn't need to do anything for JWT-based auth
  res.json({
    success: true,
    message: 'Logged out successfully',
  });
});

export default router;
