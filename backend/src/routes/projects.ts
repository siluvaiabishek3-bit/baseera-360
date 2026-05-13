/**
 * BASEERA 360 - Projects Routes
 * Complete CRUD operations for inspection projects
 */

import { Router, Request, Response } from 'express';
import { authenticate, authorize } from '@/middleware/auth';
import projectService from '@/services/project.service';
import logger from '@/config/logger';

const router = Router();

/**
 * GET /api/projects
 * Get all projects with filtering and pagination
 */
router.get('/', authenticate, async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'User not authenticated' },
    });
  }

  const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
  const offset = Math.max(parseInt(req.query.offset as string) || 0, 0);

  const filters: any = {};
  if (req.query.status) filters.status = req.query.status;
  if (req.query.facadeType) filters.facadeType = req.query.facadeType;
  if (req.query.search) filters.search = req.query.search;

  const { projects, total } = await projectService.getProjects(
    req.user.organizationId || 'unknown',
    limit,
    offset,
    filters
  );

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
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'User not authenticated' },
    });
  }

  const project = await projectService.getProject(req.params.id, req.user.id);

  res.json({
    success: true,
    data: { project },
  });
});

/**
 * POST /api/projects
 * Create new project
 */
router.post('/', authenticate, authorize(['ENGINEER', 'ADMIN']), async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'User not authenticated' },
    });
  }

  const project = await projectService.createProject(
    req.user.organizationId || 'unknown',
    req.user.id,
    req.body
  );

  logger.info('Project created via API', { projectId: project.id, userId: req.user.id });

  res.status(201).json({
    success: true,
    data: { project },
  });
});

/**
 * PATCH /api/projects/:id
 * Update project details
 */
router.patch('/:id', authenticate, authorize(['ENGINEER', 'ADMIN']), async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'User not authenticated' },
    });
  }

  const project = await projectService.updateProject(req.params.id, req.user.id, req.body);

  logger.info('Project updated via API', { projectId: req.params.id, userId: req.user.id });

  res.json({
    success: true,
    data: { project },
  });
});

/**
 * DELETE /api/projects/:id
 * Delete project (soft delete)
 */
router.delete('/:id', authenticate, authorize(['ADMIN']), async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'User not authenticated' },
    });
  }

  await projectService.deleteProject(req.params.id, req.user.id);

  logger.info('Project deleted via API', { projectId: req.params.id, userId: req.user.id });

  res.json({
    success: true,
    message: 'Project deleted successfully',
  });
});

/**
 * GET /api/projects/:id/team
 * Get project team members
 */
router.get('/:id/team', authenticate, async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'User not authenticated' },
    });
  }

  const team = await projectService.getProjectTeam(req.params.id, req.user.id);

  res.json({
    success: true,
    data: { team },
  });
});

/**
 * POST /api/projects/:id/team
 * Assign user to project
 */
router.post('/:id/team', authenticate, authorize(['ENGINEER', 'ADMIN']), async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'User not authenticated' },
    });
  }

  const { userId, role } = req.body;

  await projectService.assignUserToProject(req.params.id, req.user.id, userId, role, req.user.id);

  logger.info('User assigned to project', { projectId: req.params.id, userId, role });

  res.status(201).json({
    success: true,
    message: 'User assigned to project',
  });
});

/**
 * DELETE /api/projects/:id/team/:userId
 * Remove user from project
 */
router.delete('/:id/team/:userId', authenticate, authorize(['ENGINEER', 'ADMIN']), async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'User not authenticated' },
    });
  }

  await projectService.removeUserFromProject(req.params.id, req.params.userId, req.user.id);

  logger.info('User removed from project', {
    projectId: req.params.id,
    userId: req.params.userId,
  });

  res.json({
    success: true,
    message: 'User removed from project',
  });
});

export default router;
