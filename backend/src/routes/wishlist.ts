import { Router, Response } from 'express';
import prisma from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';
import { body, validationResult } from 'express-validator';

const router = Router();

router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const items = await prisma.wishlist.findMany({
      where: { userId: req.user!.id },
      include: { product: { select: { id: true, name: true, slug: true, price: true, discountPct: true, images: true, rating: true, stock: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return res.json({ items });
  } catch { return res.status(500).json({ error: 'Failed to fetch wishlist' }); }
});

router.post('/', authenticate, [body('productId').notEmpty()], async (req: AuthRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  try {
    const item = await prisma.wishlist.upsert({
      where: { userId_productId: { userId: req.user!.id, productId: req.body.productId } },
      create: { userId: req.user!.id, productId: req.body.productId },
      update: {},
      include: { product: { select: { id: true, name: true, slug: true, price: true, discountPct: true, images: true } } },
    });
    return res.status(201).json({ item });
  } catch { return res.status(500).json({ error: 'Failed to add to wishlist' }); }
});

router.delete('/:productId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    await prisma.wishlist.delete({ where: { userId_productId: { userId: req.user!.id, productId: req.params.productId } } });
    return res.json({ message: 'Removed from wishlist' });
  } catch { return res.status(500).json({ error: 'Failed to remove from wishlist' }); }
});

router.get('/check/:productId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const item = await prisma.wishlist.findUnique({ where: { userId_productId: { userId: req.user!.id, productId: req.params.productId } } });
    return res.json({ inWishlist: !!item });
  } catch { return res.status(500).json({ error: 'Failed to check wishlist' }); }
});

export default router;
