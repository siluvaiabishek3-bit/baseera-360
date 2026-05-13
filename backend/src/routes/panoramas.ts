import { Router, Request, Response } from 'express';
import { authenticate } from '@/middleware/auth';

const router = Router();

/**
 * GET /api/panoramas
 */
router.get('/', authenticate, async (req: Request, res: Response) => {
  res.json({ success: true, data: [] });
});

/**
 * POST /api/panoramas
 */
router.post('/', authenticate, async (req: Request, res: Response) => {
  res.status(201).json({ success: true, data: { id: 'new-id', ...req.body } });
});

/**
 * GET /api/panoramas/:id
 */
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  res.json({ success: true, data: { id: req.params.id } });
});

/**
 * PATCH /api/panoramas/:id
 */
router.patch('/:id', authenticate, async (req: Request, res: Response) => {
  res.json({ success: true, data: { id: req.params.id, ...req.body } });
});

/**
 * DELETE /api/panoramas/:id
 */
router.delete('/:id', authenticate, async (req: Request, res: Response) => {
  res.json({ success: true, message: 'Deleted successfully' });
});

export default router;
