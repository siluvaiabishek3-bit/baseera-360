"use strict";
/**
 * BASEERA 360 - Authentication Routes
 * Login, register, logout, token refresh
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_service_1 = __importDefault(require("@/services/auth.service"));
const auth_1 = require("@/middleware/auth");
const logger_1 = __importDefault(require("@/config/logger"));
const router = (0, express_1.Router)();
/**
 * POST /api/auth/register
 * User registration
 */
router.post('/register', async (req, res) => {
    const { email, password, firstName, lastName, organizationId } = req.body;
    logger_1.default.info('Register endpoint hit', { email });
    const { user, token } = await auth_service_1.default.register({
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
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    logger_1.default.info('Login endpoint hit', { email });
    const { user, token } = await auth_service_1.default.login(email, password);
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
router.post('/refresh', auth_1.authenticate, async (req, res) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            error: { code: 'UNAUTHORIZED', message: 'User not authenticated' },
        });
    }
    const token = auth_service_1.default.refreshToken(req.user.id);
    res.json({
        success: true,
        data: { token },
    });
});
/**
 * GET /api/auth/me
 * Get current user profile
 */
router.get('/me', auth_1.authenticate, async (req, res) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            error: { code: 'UNAUTHORIZED', message: 'User not authenticated' },
        });
    }
    const user = await auth_service_1.default.getUserById(req.user.id);
    res.json({
        success: true,
        data: { user },
    });
});
/**
 * POST /api/auth/logout
 * Logout (client-side token deletion)
 */
router.post('/logout', auth_1.authenticate, (req, res) => {
    logger_1.default.info('User logout', { userId: req.user?.id });
    // Token is deleted on client side
    // Server doesn't need to do anything for JWT-based auth
    res.json({
        success: true,
        message: 'Logged out successfully',
    });
});
exports.default = router;
//# sourceMappingURL=auth.js.map