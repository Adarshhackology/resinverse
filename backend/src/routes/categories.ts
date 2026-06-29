import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true }, orderBy: { sortOrder: 'asc' },
      include: { _count: { select: { products: { where: { isActive: true } } } } },
    });
    return res.json({ categories });
  } catch { return res.status(500).json({ error: 'Failed to fetch categories' }); }
});

router.get('/:slug', async (req: Request, res: Response) => {
  try {
    const category = await prisma.category.findUnique({ where: { slug: req.params.slug } });
    if (!category) return res.status(404).json({ error: 'Category not found' });
    const products = await prisma.product.findMany({
      where: { categoryId: category.id, isActive: true },
      orderBy: { createdAt: 'desc' },
      take: 24,
    });
    return res.json({ category, products });
  } catch { return res.status(500).json({ error: 'Failed to fetch category' }); }
});

router.post('/', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  const { name, description, icon, image, sortOrder, gradient, glow } = req.body;
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  try {
    const category = await prisma.category.create({ data: { name, slug, description, icon, image, gradient, glow, sortOrder: sortOrder || 0 } });
    return res.status(201).json({ category });
  } catch { return res.status(500).json({ error: 'Failed to create category' }); }
});

router.put('/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const category = await prisma.category.update({ where: { id: req.params.id }, data: req.body });
    return res.json({ category });
  } catch { return res.status(500).json({ error: 'Failed to update category' }); }
});

export default router;
