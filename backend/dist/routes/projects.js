"use strict";
/**
 * BASEERA 360 - Projects Routes
 * Complete CRUD operations for inspection projects
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("@/middleware/auth");
const project_service_1 = __importDefault(require("@/services/project.service"));
const logger_1 = __importDefault(require("@/config/logger"));
const router = (0, express_1.Router)();
/**
 * GET /api/projects
 * Get all projects with filtering and pagination
 */
router.get('/', auth_1.authenticate, async (req, res) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            error: { code: 'UNAUTHORIZED', message: 'User not authenticated' },
        });
    }
    const limit = Math.min(parseInt(req.query.limit) || 50, 200);
    const offset = Math.max(parseInt(req.query.offset) || 0, 0);
    const filters = {};
    if (req.query.status)
        filters.status = req.query.status;
    if (req.query.facadeType)
        filters.facadeType = req.query.facadeType;
    if (req.query.search)
        filters.search = req.query.search;
    const { projects, total } = await project_service_1.default.getProjects(req.user.organizationId || 'unknown', limit, offset, filters);
    res.json({
        success: true,
        data: {
            projects,
            pagination: { limit, offset, total },
        },
    });
});
/**
 * GET /api/projects/:id
 * Get specific project with details
 */
router.get('/:id', auth_1.authenticate, async (req, res) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            error: { code: 'UNAUTHORIZED', message: 'User not authenticated' },
        });
    }
    const project = await project_service_1.default.getProject(req.params.id, req.user.id);
    res.json({
        success: true,
        data: { project },
    });
});
/**
 * POST /api/projects
 * Create new project
 */
router.post('/', auth_1.authenticate, (0, auth_1.authorize)(['ENGINEER', 'ADMIN']), async (req, res) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            error: { code: 'UNAUTHORIZED', message: 'User not authenticated' },
        });
    }
    const project = await project_service_1.default.createProject(req.user.organizationId || 'unknown', req.user.id, req.body);
    logger_1.default.info('Project created via API', { projectId: project.id, userId: req.user.id });
    res.status(201).json({
        success: true,
        data: { project },
    });
});
/**
 * PATCH /api/projects/:id
 * Update project details
 */
router.patch('/:id', auth_1.authenticate, (0, auth_1.authorize)(['ENGINEER', 'ADMIN']), async (req, res) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            error: { code: 'UNAUTHORIZED', message: 'User not authenticated' },
        });
    }
    const project = await project_service_1.default.updateProject(req.params.id, req.user.id, req.body);
    logger_1.default.info('Project updated via API', { projectId: req.params.id, userId: req.user.id });
    res.json({
        success: true,
        data: { project },
    });
});
/**
 * DELETE /api/projects/:id
 * Delete project (soft delete)
 */
router.delete('/:id', auth_1.authenticate, (0, auth_1.authorize)(['ADMIN']), async (req, res) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            error: { code: 'UNAUTHORIZED', message: 'User not authenticated' },
        });
    }
    await project_service_1.default.deleteProject(req.params.id, req.user.id);
    logger_1.default.info('Project deleted via API', { projectId: req.params.id, userId: req.user.id });
    res.json({
        success: true,
        message: 'Project deleted successfully',
    });
});
/**
 * GET /api/projects/:id/team
 * Get project team members
 */
router.get('/:id/team', auth_1.authenticate, async (req, res) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            error: { code: 'UNAUTHORIZED', message: 'User not authenticated' },
        });
    }
    const team = await project_service_1.default.getProjectTeam(req.params.id, req.user.id);
    res.json({
        success: true,
        data: { team },
    });
});
/**
 * POST /api/projects/:id/team
 * Assign user to project
 */
router.post('/:id/team', auth_1.authenticate, (0, auth_1.authorize)(['ENGINEER', 'ADMIN']), async (req, res) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            error: { code: 'UNAUTHORIZED', message: 'User not authenticated' },
        });
    }
    const { userId, role } = req.body;
    await project_service_1.default.assignUserToProject(req.params.id, req.user.id, userId, role, req.user.id);
    logger_1.default.info('User assigned to project', { projectId: req.params.id, userId, role });
    res.status(201).json({
        success: true,
        message: 'User assigned to project',
    });
});
/**
 * DELETE /api/projects/:id/team/:userId
 * Remove user from project
 */
router.delete('/:id/team/:userId', auth_1.authenticate, (0, auth_1.authorize)(['ENGINEER', 'ADMIN']), async (req, res) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            error: { code: 'UNAUTHORIZED', message: 'User not authenticated' },
        });
    }
    await project_service_1.default.removeUserFromProject(req.params.id, req.params.userId, req.user.id);
    logger_1.default.info('User removed from project', {
        projectId: req.params.id,
        userId: req.params.userId,
    });
    res.json({
        success: true,
        message: 'User removed from project',
    });
});
exports.default = router;
//# sourceMappingURL=projects.js.map