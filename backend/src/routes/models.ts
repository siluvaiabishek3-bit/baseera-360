import { Router, Request, Response } from 'express';
import { authenticate } from '@/middleware/auth';

const router = Router();

/**
 * GET /api/models
 */
router.get('/', authenticate, async (req: Request, res: Response) => {
  res.json({ success: true, data: [] });
});

/**
 * POST /api/models
 */
router.post('/', authenticate, async (req: Request, res: Response) => {
  res.status(201).json({ success: true, data: { id: 'new-id', ...req.body } });
});

/**
 * GET /api/models/:id
 */
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  res.json({ success: true, data: { id: req.params.id } });
});

/**
 * PATCH /api/models/:id
 */
router.patch('/:id', authenticate, async (req: Request, res: Response) => {
  res.json({ success: true, data: { id: req.params.id, ...req.body } });
});

/**
 * DELETE /api/models/:id
 */
router.delete('/:id', authenticate, async (req: Request, res: Response) => {
  res.json({ success: true, message: 'Deleted successfully' });
});

export default router;
