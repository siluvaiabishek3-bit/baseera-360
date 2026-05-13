"use strict";
/**
 * BASEERA 360 - Media Routes
 * File upload and media management
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("@/middleware/auth");
const media_service_1 = __importDefault(require("@/services/media.service"));
const logger_1 = __importDefault(require("@/config/logger"));
const multer_1 = __importDefault(require("multer"));
const router = (0, express_1.Router)();
// Configure multer for file uploads
const upload = (0, multer_1.default)({
    storage: multer_1.default.diskStorage({
        destination: (req, file, cb) => {
            const projectId = req.query.projectId;
            cb(null, `./uploads/${projectId}`);
        },
        filename: (req, file, cb) => {
            const uniqueName = `${Date.now()}_${file.originalname}`;
            cb(null, uniqueName);
        },
    }),
    limits: { fileSize: 500 * 1024 * 1024 }, // 500MB
    fileFilter: (req, file, cb) => {
        const allowedMimes = [
            'image/jpeg', 'image/png', // RGB images
            'video/mp4', 'video/quicktime', // Videos
            'model/obj', 'model/gltf', 'application/octet-stream', // 3D models
            'application/dwg', 'application/dxf', // CAD
        ];
        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new Error(`Unsupported file type: ${file.mimetype}`));
        }
    },
});
/**
 * POST /api/media
 * Upload new media file
 */
router.post('/', auth_1.authenticate, (0, auth_1.authorize)(['ENGINEER', 'ADMIN']), upload.single('file'), async (req, res) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            error: { code: 'UNAUTHORIZED', message: 'User not authenticated' },
        });
    }
    if (!req.file) {
        return res.status(400).json({
            success: false,
            error: { code: 'VALIDATION_ERROR', message: 'No file provided' },
        });
    }
    const projectId = req.query.projectId;
    if (!projectId) {
        return res.status(400).json({
            success: false,
            error: { code: 'VALIDATION_ERROR', message: 'projectId query parameter required' },
        });
    }
    // Parse metadata if provided
    let metadata;
    if (req.body.metadata) {
        try {
            metadata = JSON.parse(req.body.metadata);
        }
        catch (error) {
            logger_1.default.warn('Invalid metadata JSON', error);
        }
    }
    const media = await media_service_1.default.uploadMedia(projectId, req.user.id, {
        filename: req.file.filename,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        path: req.file.path,
    }, metadata);
    logger_1.default.info('Media uploaded successfully', { mediaId: media.id, projectId });
    res.status(201).json({
        success: true,
        data: { media },
    });
});
/**
 * GET /api/media
 * Get media for project with pagination
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
    const limit = Math.min(parseInt(req.query.limit) || 50, 200);
    const offset = Math.max(parseInt(req.query.offset) || 0, 0);
    const filters = {};
    if (req.query.mediaType)
        filters.mediaType = req.query.mediaType;
    const { media, total } = await media_service_1.default.getProjectMedia(projectId, req.user.id, limit, offset, filters);
    res.json({
        success: true,
        data: {
            media,
            pagination: { limit, offset, total },
        },
    });
});
/**
 * GET /api/media/:id
 * Get specific media details
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
    const media = await media_service_1.default.getMedia(req.params.id, projectId);
    res.json({
        success: true,
        data: { media },
    });
});
/**
 * PATCH /api/media/:id
 * Update media metadata
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
    const media = await media_service_1.default.updateMediaMetadata(req.params.id, projectId, req.body, req.user.id);
    logger_1.default.info('Media metadata updated', { mediaId: req.params.id });
    res.json({
        success: true,
        data: { media },
    });
});
/**
 * DELETE /api/media/:id
 * Delete media (soft delete)
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
    await media_service_1.default.deleteMedia(req.params.id, projectId, req.user.id);
    logger_1.default.info('Media deleted', { mediaId: req.params.id });
    res.json({
        success: true,
        message: 'Media deleted successfully',
    });
});
/**
 * GET /api/media/project/:projectId/stats
 * Get media statistics for project
 */
router.get('/project/:projectId/stats', auth_1.authenticate, async (req, res) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            error: { code: 'UNAUTHORIZED', message: 'User not authenticated' },
        });
    }
    const stats = await media_service_1.default.getMediaStatistics(req.params.projectId);
    res.json({
        success: true,
        data: { stats },
    });
});
exports.default = router;
//# sourceMappingURL=media.js.map