import { Router, Response } from 'express';
import prisma from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';
import { body, validationResult } from 'express-validator';

const router = Router();

router.post('/', authenticate, [
  body('productType').notEmpty(),
  body('name').optional().isString(),
], async (req: AuthRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { productType, photos, name, colors, glitter, flowers, shape, notes } = req.body;
  try {
    const customOrder = await prisma.customOrder.create({
      data: { userId: req.user!.id, productType, photos: photos || [], name, colors: colors || [], glitter: glitter || false, flowers: flowers || false, shape, notes },
    });
    return res.status(201).json({ customOrder, message: 'Custom order submitted! We\'ll quote you within 24 hours.' });
  } catch { return res.status(500).json({ error: 'Failed to submit custom order' }); }
});

router.get('/my', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const orders = await prisma.customOrder.findMany({
      where: { userId: req.user!.id }, orderBy: { createdAt: 'desc' },
    });
    return res.json({ orders });
  } catch { return res.status(500).json({ error: 'Failed to fetch custom orders' }); }
});

export default router;
