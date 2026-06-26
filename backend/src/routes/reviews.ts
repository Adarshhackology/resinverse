import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';
import { body, validationResult } from 'express-validator';

const router = Router();

router.get('/:productId', async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  try {
    const [reviews, total, avgRating] = await Promise.all([
      prisma.review.findMany({
        where: { productId: req.params.productId },
        skip: (page - 1) * limit, take: limit,
        orderBy: { helpful: 'desc' },
        include: { user: { select: { id: true, name: true, avatar: true } } },
      }),
      prisma.review.count({ where: { productId: req.params.productId } }),
      prisma.review.aggregate({ where: { productId: req.params.productId }, _avg: { rating: true } }),
    ]);
    return res.json({ reviews, total, avgRating: avgRating._avg.rating || 0, pagination: { page, limit, pages: Math.ceil(total / limit) } });
  } catch { return res.status(500).json({ error: 'Failed to fetch reviews' }); }
});

router.post('/', authenticate, [
  body('productId').notEmpty(),
  body('rating').isInt({ min: 1, max: 5 }),
  body('comment').trim().isLength({ min: 10 }),
], async (req: AuthRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { productId, rating, title, comment, images } = req.body;
  try {
    // Check if user bought the product
    const purchase = await prisma.orderItem.findFirst({
      where: { productId, order: { userId: req.user!.id, status: { in: ['DELIVERED', 'SHIPPED'] } } },
    });

    const review = await prisma.review.upsert({
      where: { productId_userId: { productId, userId: req.user!.id } },
      create: { productId, userId: req.user!.id, rating, title, comment, images: images || [], isVerified: !!purchase },
      update: { rating, title, comment, images: images || [] },
      include: { user: { select: { id: true, name: true, avatar: true } } },
    });

    // Update product avg rating
    const avgRating = await prisma.review.aggregate({ where: { productId }, _avg: { rating: true }, _count: true });
    await prisma.product.update({
      where: { id: productId },
      data: { rating: Math.round((avgRating._avg.rating || 0) * 10) / 10, reviewCount: avgRating._count },
    });

    return res.status(201).json({ review });
  } catch { return res.status(500).json({ error: 'Failed to submit review' }); }
});

router.post('/:id/helpful', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const review = await prisma.review.update({ where: { id: req.params.id }, data: { helpful: { increment: 1 } } });
    return res.json({ helpful: review.helpful });
  } catch { return res.status(500).json({ error: 'Failed to mark helpful' }); }
});

router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    await prisma.review.deleteMany({ where: { id: req.params.id, userId: req.user!.id } });
    return res.json({ message: 'Review deleted' });
  } catch { return res.status(500).json({ error: 'Failed to delete review' }); }
});

export default router;
