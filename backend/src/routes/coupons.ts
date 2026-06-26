import { Router, Response } from 'express';
import prisma from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

router.post('/validate', async (req: any, res: Response) => {
  const { code, subtotal } = req.body;
  try {
    const coupon = await prisma.coupon.findUnique({ where: { code: code?.toUpperCase() } });
    if (!coupon || !coupon.isActive) return res.status(400).json({ error: 'Invalid coupon code' });
    if (coupon.expiresAt && coupon.expiresAt < new Date()) return res.status(400).json({ error: 'Coupon has expired' });
    if (coupon.usedCount >= coupon.maxUses) return res.status(400).json({ error: 'Coupon usage limit reached' });
    if (subtotal && subtotal < coupon.minOrder) return res.status(400).json({ error: `Min order ₹${coupon.minOrder}` });
    
    let discount = coupon.discountPct ? (subtotal * coupon.discountPct / 100) : (coupon.discountAmt || 0);
    if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
    
    return res.json({ valid: true, coupon, discount });
  } catch { return res.status(500).json({ error: 'Validation failed' }); }
});

export default router;
