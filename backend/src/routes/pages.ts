import express, { Request, Response } from 'express';
import { prisma } from '../index';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';
import { body, param, validationResult } from 'express-validator';

const router = express.Router();

// GET /api/pages/:slug - Public
router.get('/:slug', async (req: Request, res: Response) => {
  try {
    const page = await prisma.page.findUnique({
      where: { slug: req.params.slug },
    });

    if (!page || !page.isActive) {
      return res.status(404).json({ error: 'Page not found' });
    }

    res.json({ page });
  } catch (error) {
    console.error('Error fetching page:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/pages/admin/list - Admin
router.get('/admin/list', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const pages = await prisma.page.findMany({
      orderBy: { title: 'asc' },
    });
    res.json({ pages });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch pages' });
  }
});

// PUT /api/pages/admin/:slug - Admin create or update page
router.put('/admin/:slug', authenticate, requireAdmin, [
  body('title').notEmpty().withMessage('Title is required'),
  body('content').isString(),
  body('isActive').isBoolean().optional(),
], async (req: AuthRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { slug } = req.params;
  const { title, content, isActive = true } = req.body;

  try {
    const page = await prisma.page.upsert({
      where: { slug },
      update: { title, content, isActive },
      create: { slug, title, content, isActive },
    });
    res.json({ page });
  } catch (error) {
    console.error('Failed to save page:', error);
    res.status(500).json({ error: 'Failed to save page' });
  }
});

export default router;
