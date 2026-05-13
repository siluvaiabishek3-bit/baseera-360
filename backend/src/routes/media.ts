/**
 * BASEERA 360 - Media Routes
 * File upload and media management
 */

import { Router, Request, Response } from 'express';
import { authenticate, authorize } from '@/middleware/auth';
import mediaService from '@/services/media.service';
import logger from '@/config/logger';
import multer from 'multer';
import path from 'path';

const router = Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const projectId = req.query.projectId as string;
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
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}`));
    }
  },
});

/**
 * POST /api/media
 * Upload new media file
 */
router.post('/', authenticate, authorize(['ENGINEER', 'ADMIN']), upload.single('file'), async (req: Request, res: Response) => {
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

  const projectId = req.query.projectId as string;
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
    } catch (error) {
      logger.warn('Invalid metadata JSON', error);
    }
  }

  const media = await mediaService.uploadMedia(projectId, req.user.id, {
    filename: req.file.filename,
    originalname: req.file.originalname,
    mimetype: req.file.mimetype,
    size: req.file.size,
    path: req.file.path,
  }, metadata);

  logger.info('Media uploaded successfully', { mediaId: media.id, projectId });

  res.status(201).json({
    success: true,
    data: { media },
  });
});

/**
 * GET /api/media
 * Get media for project with pagination
 */
router.get('/', authenticate, async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'User not authenticated' },
    });
  }

  const projectId = req.query.projectId as string;
  if (!projectId) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'projectId query parameter required' },
    });
  }

  const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
  const offset = Math.max(parseInt(req.query.offset as string) || 0, 0);

  const filters: any = {};
  if (req.query.mediaType) filters.mediaType = req.query.mediaType;

  const { media, total } = await mediaService.getProjectMedia(projectId, req.user.id, limit, offset, filters);

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
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'User not authenticated' },
    });
  }

  const projectId = req.query.projectId as string;
  if (!projectId) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'projectId query parameter required' },
    });
  }

  const media = await mediaService.getMedia(req.params.id, projectId);

  res.json({
    success: true,
    data: { media },
  });
});

/**
 * PATCH /api/media/:id
 * Update media metadata
 */
router.patch('/:id', authenticate, authorize(['ENGINEER', 'ADMIN']), async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'User not authenticated' },
    });
  }

  const projectId = req.query.projectId as string;
  if (!projectId) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'projectId query parameter required' },
    });
  }

  const media = await mediaService.updateMediaMetadata(req.params.id, projectId, req.body, req.user.id);

  logger.info('Media metadata updated', { mediaId: req.params.id });

  res.json({
    success: true,
    data: { media },
  });
});

/**
 * DELETE /api/media/:id
 * Delete media (soft delete)
 */
router.delete('/:id', authenticate, authorize(['ENGINEER', 'ADMIN']), async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'User not authenticated' },
    });
  }

  const projectId = req.query.projectId as string;
  if (!projectId) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'projectId query parameter required' },
    });
  }

  await mediaService.deleteMedia(req.params.id, projectId, req.user.id);

  logger.info('Media deleted', { mediaId: req.params.id });

  res.json({
    success: true,
    message: 'Media deleted successfully',
  });
});

/**
 * GET /api/media/project/:projectId/stats
 * Get media statistics for project
 */
router.get('/project/:projectId/stats', authenticate, async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'User not authenticated' },
    });
  }

  const stats = await mediaService.getMediaStatistics(req.params.projectId);

  res.json({
    success: true,
    data: { stats },
  });
});

export default router;
