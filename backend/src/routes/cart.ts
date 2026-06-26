import { Router, Response } from 'express';
import prisma from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';
import { body, validationResult } from 'express-validator';

const router = Router();

// Cart stored server-side in user session / client-side for guests
// This endpoint syncs cart from client to server and validates prices

router.post('/validate', async (req: AuthRequest, res: Response) => {
  const { items } = req.body;
  if (!items?.length) return res.json({ items: [], total: 0 });
  
  try {
    const productIds = items.map((i: any) => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, isActive: true },
      select: { id: true, name: true, price: true, discountPct: true, stock: true, images: true, slug: true },
    });

    const validatedItems = items.map((item: any) => {
      const product = products.find(p => p.id === item.productId);
      if (!product) return null;
      return {
        ...item,
        product,
        currentPrice: product.price * (1 - product.discountPct / 100),
        available: product.stock >= item.quantity,
      };
    }).filter(Boolean);

    const total = validatedItems.reduce((sum: number, item: any) => sum + item.currentPrice * item.quantity, 0);
    return res.json({ items: validatedItems, subtotal: total, shippingCost: total > 999 ? 0 : 49 });
  } catch { return res.status(500).json({ error: 'Cart validation failed' }); }
});

router.post('/apply-coupon', async (req: AuthRequest, res: Response) => {
  const { code, subtotal } = req.body;
  try {
    const coupon = await prisma.coupon.findUnique({ where: { code: code.toUpperCase() } });
    if (!coupon || !coupon.isActive) return res.status(400).json({ error: 'Invalid coupon code' });
    if (coupon.expiresAt && coupon.expiresAt < new Date()) return res.status(400).json({ error: 'Coupon has expired' });
    if (coupon.usedCount >= coupon.maxUses) return res.status(400).json({ error: 'Coupon usage limit reached' });
    if (subtotal < coupon.minOrder) return res.status(400).json({ error: `Minimum order amount is ₹${coupon.minOrder}` });

    let discount = coupon.discountPct ? (subtotal * coupon.discountPct / 100) : (coupon.discountAmt || 0);
    if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);

    return res.json({ coupon: { code: coupon.code, description: coupon.description, discountPct: coupon.discountPct, discountAmt: coupon.discountAmt }, discount });
  } catch { return res.status(500).json({ error: 'Failed to apply coupon' }); }
});

export default router;
