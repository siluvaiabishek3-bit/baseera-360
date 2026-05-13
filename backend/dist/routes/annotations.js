"use strict";
/**
 * BASEERA 360 - Annotations Routes
 * Defect marking and annotation management
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("@/middleware/auth");
const annotation_service_1 = __importDefault(require("@/services/annotation.service"));
const comment_service_1 = __importDefault(require("@/services/comment.service"));
const logger_1 = __importDefault(require("@/config/logger"));
const router = (0, express_1.Router)();
/**
 * POST /api/annotations
 * Create new annotation
 */
router.post('/', auth_1.authenticate, (0, auth_1.authorize)(['ENGINEER', 'ADMIN']), async (req, res) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            error: { code: 'UNAUTHORIZED', message: 'User not authenticated' },
        });
    }
    const { projectId, ...annotationData } = req.body;
    if (!projectId) {
        return res.status(400).json({
            success: false,
            error: { code: 'VALIDATION_ERROR', message: 'projectId is required' },
        });
    }
    const annotation = await annotation_service_1.default.createAnnotation(projectId, req.user.id, annotationData);
    logger_1.default.info('Annotation created via API', { annotationId: annotation.id, userId: req.user.id });
    res.status(201).json({
        success: true,
        data: { annotation },
    });
});
/**
 * GET /api/annotations
 * Get annotations for project with filtering
 */
router.get('/', auth_1.authenticate, async (req, res) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            error: { code: 'UNAUTHORIZED', message: 'User not authenticated' },
        });
    }
    const projectId = req.query.projectId;
    if (!projectId) {
        return res.status(400).json({
            success: false,
            error: { code: 'VALIDATION_ERROR', message: 'projectId query parameter required' },
        });
    }
    const filters = {};
    if (req.query.status)
        filters.status = req.query.status;
    if (req.query.severity)
        filters.severity = req.query.severity;
    if (req.query.category)
        filters.category = req.query.category;
    if (req.query.mediaId)
        filters.mediaId = req.query.mediaId;
    const { annotations, total } = await annotation_service_1.default.getProjectAnnotations(projectId, req.user.id, filters);
    res.json({
        success: true,
        data: {
            annotations,
            total,
        },
    });
});
/**
 * GET /api/annotations/:id
 * Get single annotation details
 */
router.get('/:id', auth_1.authenticate, async (req, res) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            error: { code: 'UNAUTHORIZED', message: 'User not authenticated' },
        });
    }
    const projectId = req.query.projectId;
    if (!projectId) {
        return res.status(400).json({
            success: false,
            error: { code: 'VALIDATION_ERROR', message: 'projectId query parameter required' },
        });
    }
    const annotation = await annotation_service_1.default.getAnnotation(req.params.id, projectId);
    res.json({
        success: true,
        data: { annotation },
    });
});
/**
 * PATCH /api/annotations/:id
 * Update annotation
 */
router.patch('/:id', auth_1.authenticate, (0, auth_1.authorize)(['ENGINEER', 'ADMIN']), async (req, res) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            error: { code: 'UNAUTHORIZED', message: 'User not authenticated' },
        });
    }
    const projectId = req.query.projectId;
    if (!projectId) {
        return res.status(400).json({
            success: false,
            error: { code: 'VALIDATION_ERROR', message: 'projectId query parameter required' },
        });
    }
    const annotation = await annotation_service_1.default.updateAnnotation(req.params.id, projectId, req.user.id, req.body);
    logger_1.default.info('Annotation updated via API', { annotationId: req.params.id });
    res.json({
        success: true,
        data: { annotation },
    });
});
/**
 * PATCH /api/annotations/:id/status
 * Update annotation status
 */
router.patch('/:id/status', auth_1.authenticate, (0, auth_1.authorize)(['ENGINEER', 'ADMIN']), async (req, res) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            error: { code: 'UNAUTHORIZED', message: 'User not authenticated' },
        });
    }
    const projectId = req.query.projectId;
    if (!projectId) {
        return res.status(400).json({
            success: false,
            error: { code: 'VALIDATION_ERROR', message: 'projectId query parameter required' },
        });
    }
    const { status, resolutionNotes } = req.body;
    if (!status) {
        return res.status(400).json({
            success: false,
            error: { code: 'VALIDATION_ERROR', message: 'status is required' },
        });
    }
    const annotation = await annotation_service_1.default.updateAnnotationStatus(req.params.id, projectId, req.user.id, status, resolutionNotes);
    logger_1.default.info('Annotation status updated via API', { annotationId: req.params.id, status });
    res.json({
        success: true,
        data: { annotation },
    });
});
/**
 * DELETE /api/annotations/:id
 * Delete annotation (soft delete)
 */
router.delete('/:id', auth_1.authenticate, (0, auth_1.authorize)(['ENGINEER', 'ADMIN']), async (req, res) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            error: { code: 'UNAUTHORIZED', message: 'User not authenticated' },
        });
    }
    const projectId = req.query.projectId;
    if (!projectId) {
        return res.status(400).json({
            success: false,
            error: { code: 'VALIDATION_ERROR', message: 'projectId query parameter required' },
        });
    }
    await annotation_service_1.default.deleteAnnotation(req.params.id, projectId, req.user.id);
    logger_1.default.info('Annotation deleted via API', { annotationId: req.params.id });
    res.json({
        success: true,
        message: 'Annotation deleted successfully',
    });
});
/**
 * PATCH /api/annotations/:id/assign
 * Assign annotation to user
 */
router.patch('/:id/assign', auth_1.authenticate, (0, auth_1.authorize)(['ENGINEER', 'ADMIN']), async (req, res) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            error: { code: 'UNAUTHORIZED', message: 'User not authenticated' },
        });
    }
    const projectId = req.query.projectId;
    if (!projectId) {
        return res.status(400).json({
            success: false,
            error: { code: 'VALIDATION_ERROR', message: 'projectId query parameter required' },
        });
    }
    const { userId } = req.body;
    if (!userId) {
        return res.status(400).json({
            success: false,
            error: { code: 'VALIDATION_ERROR', message: 'userId is required' },
        });
    }
    const annotation = await annotation_service_1.default.assignAnnotation(req.params.id, projectId, userId, req.user.id);
    logger_1.default.info('Annotation assigned via API', { annotationId: req.params.id, assignedTo: userId });
    res.json({
        success: true,
        data: { annotation },
    });
});
/**
 * GET /api/annotations/project/:projectId/stats
 * Get annotation statistics
 */
router.get('/project/:projectId/stats', auth_1.authenticate, async (req, res) => {
    const stats = await annotation_service_1.default.getAnnotationStatistics(req.params.projectId);
    res.json({
        success: true,
        data: { stats },
    });
});
/**
 * POST /api/annotations/:id/comments
 * Create comment on annotation
 */
router.post('/:id/comments', auth_1.authenticate, async (req, res) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            error: { code: 'UNAUTHORIZED', message: 'User not authenticated' },
        });
    }
    const projectId = req.query.projectId;
    if (!projectId) {
        return res.status(400).json({
            success: false,
            error: { code: 'VALIDATION_ERROR', message: 'projectId query parameter required' },
        });
    }
    const { message, attachmentUrl } = req.body;
    const comment = await comment_service_1.default.createComment(projectId, req.user.id, {
        annotationId: req.params.id,
        message,
        attachmentUrl,
    });
    logger_1.default.info('Comment created via API', { annotationId: req.params.id, commentId: comment.id });
    res.status(201).json({
        success: true,
        data: { comment },
    });
});
/**
 * GET /api/annotations/:id/comments
 * Get comments on annotation
 */
router.get('/:id/comments', auth_1.authenticate, async (req, res) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            error: { code: 'UNAUTHORIZED', message: 'User not authenticated' },
        });
    }
    const projectId = req.query.projectId;
    if (!projectId) {
        return res.status(400).json({
            success: false,
            error: { code: 'VALIDATION_ERROR', message: 'projectId query parameter required' },
        });
    }
    const comments = await comment_service_1.default.getAnnotationComments(projectId, req.params.id);
    res.json({
        success: true,
        data: { comments },
    });
});
/**
 * PATCH /api/annotations/:id/comments/:commentId
 * Update comment
 */
router.patch('/:id/comments/:commentId', auth_1.authenticate, async (req, res) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            error: { code: 'UNAUTHORIZED', message: 'User not authenticated' },
        });
    }
    const projectId = req.query.projectId;
    if (!projectId) {
        return res.status(400).json({
            success: false,
            error: { code: 'VALIDATION_ERROR', message: 'projectId query parameter required' },
        });
    }
    const comment = await comment_service_1.default.updateComment(req.params.commentId, projectId, req.user.id, req.body);
    logger_1.default.info('Comment updated via API', { commentId: req.params.commentId });
    res.json({
        success: true,
        data: { comment },
    });
});
/**
 * DELETE /api/annotations/:id/comments/:commentId
 * Delete comment
 */
router.delete('/:id/comments/:commentId', auth_1.authenticate, async (req, res) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            error: { code: 'UNAUTHORIZED', message: 'User not authenticated' },
        });
    }
    const projectId = req.query.projectId;
    if (!projectId) {
        return res.status(400).json({
            success: false,
            error: { code: 'VALIDATION_ERROR', message: 'projectId query parameter required' },
        });
    }
    await comment_service_1.default.deleteComment(req.params.commentId, projectId, req.user.id);
    logger_1.default.info('Comment deleted via API', { commentId: req.params.commentId });
    res.json({
        success: true,
        message: 'Comment deleted successfully',
    });
});
exports.default = router;
//# sourceMappingURL=annotations.js.map