/**
 * BASEERA 360 - Annotations Routes
 * Defect marking and annotation management
 */

import { Router, Request, Response } from 'express';
import { authenticate, authorize } from '@/middleware/auth';
import annotationService from '@/services/annotation.service';
import commentService from '@/services/comment.service';
import logger from '@/config/logger';

const router = Router();

/**
 * POST /api/annotations
 * Create new annotation
 */
router.post('/', authenticate, authorize(['ENGINEER', 'ADMIN']), async (req: Request, res: Response) => {
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

  const annotation = await annotationService.createAnnotation(
    projectId,
    req.user.id,
    annotationData
  );

  logger.info('Annotation created via API', { annotationId: annotation.id, userId: req.user.id });

  res.status(201).json({
    success: true,
    data: { annotation },
  });
});

/**
 * GET /api/annotations
 * Get annotations for project with filtering
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

  const filters: any = {};
  if (req.query.status) filters.status = req.query.status;
  if (req.query.severity) filters.severity = req.query.severity;
  if (req.query.category) filters.category = req.query.category;
  if (req.query.mediaId) filters.mediaId = req.query.mediaId;

  const { annotations, total } = await annotationService.getProjectAnnotations(
    projectId,
    req.user.id,
    filters
  );

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

  const annotation = await annotationService.getAnnotation(req.params.id, projectId);

  res.json({
    success: true,
    data: { annotation },
  });
});

/**
 * PATCH /api/annotations/:id
 * Update annotation
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

  const annotation = await annotationService.updateAnnotation(
    req.params.id,
    projectId,
    req.user.id,
    req.body
  );

  logger.info('Annotation updated via API', { annotationId: req.params.id });

  res.json({
    success: true,
    data: { annotation },
  });
});

/**
 * PATCH /api/annotations/:id/status
 * Update annotation status
 */
router.patch('/:id/status', authenticate, authorize(['ENGINEER', 'ADMIN']), async (req: Request, res: Response) => {
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

  const { status, resolutionNotes } = req.body;
  if (!status) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'status is required' },
    });
  }

  const annotation = await annotationService.updateAnnotationStatus(
    req.params.id,
    projectId,
    req.user.id,
    status,
    resolutionNotes
  );

  logger.info('Annotation status updated via API', { annotationId: req.params.id, status });

  res.json({
    success: true,
    data: { annotation },
  });
});

/**
 * DELETE /api/annotations/:id
 * Delete annotation (soft delete)
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

  await annotationService.deleteAnnotation(req.params.id, projectId, req.user.id);

  logger.info('Annotation deleted via API', { annotationId: req.params.id });

  res.json({
    success: true,
    message: 'Annotation deleted successfully',
  });
});

/**
 * PATCH /api/annotations/:id/assign
 * Assign annotation to user
 */
router.patch('/:id/assign', authenticate, authorize(['ENGINEER', 'ADMIN']), async (req: Request, res: Response) => {
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

  const { userId } = req.body;
  if (!userId) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'userId is required' },
    });
  }

  const annotation = await annotationService.assignAnnotation(
    req.params.id,
    projectId,
    userId,
    req.user.id
  );

  logger.info('Annotation assigned via API', { annotationId: req.params.id, assignedTo: userId });

  res.json({
    success: true,
    data: { annotation },
  });
});

/**
 * GET /api/annotations/project/:projectId/stats
 * Get annotation statistics
 */
router.get('/project/:projectId/stats', authenticate, async (req: Request, res: Response) => {
  const stats = await annotationService.getAnnotationStatistics(req.params.projectId);

  res.json({
    success: true,
    data: { stats },
  });
});

/**
 * POST /api/annotations/:id/comments
 * Create comment on annotation
 */
router.post('/:id/comments', authenticate, async (req: Request, res: Response) => {
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

  const { message, attachmentUrl } = req.body;

  const comment = await commentService.createComment(projectId, req.user.id, {
    annotationId: req.params.id,
    message,
    attachmentUrl,
  });

  logger.info('Comment created via API', { annotationId: req.params.id, commentId: comment.id });

  res.status(201).json({
    success: true,
    data: { comment },
  });
});

/**
 * GET /api/annotations/:id/comments
 * Get comments on annotation
 */
router.get('/:id/comments', authenticate, async (req: Request, res: Response) => {
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

  const comments = await commentService.getAnnotationComments(projectId, req.params.id);

  res.json({
    success: true,
    data: { comments },
  });
});

/**
 * PATCH /api/annotations/:id/comments/:commentId
 * Update comment
 */
router.patch('/:id/comments/:commentId', authenticate, async (req: Request, res: Response) => {
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

  const comment = await commentService.updateComment(
    req.params.commentId,
    projectId,
    req.user.id,
    req.body
  );

  logger.info('Comment updated via API', { commentId: req.params.commentId });

  res.json({
    success: true,
    data: { comment },
  });
});

/**
 * DELETE /api/annotations/:id/comments/:commentId
 * Delete comment
 */
router.delete('/:id/comments/:commentId', authenticate, async (req: Request, res: Response) => {
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

  await commentService.deleteComment(req.params.commentId, projectId, req.user.id);

  logger.info('Comment deleted via API', { commentId: req.params.commentId });

  res.json({
    success: true,
    message: 'Comment deleted successfully',
  });
});

export default router;
