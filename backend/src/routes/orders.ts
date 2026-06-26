import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';
import { body, validationResult } from 'express-validator';

const router = Router();

// GET /api/orders - user's orders
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const orders = await prisma.order.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' },
      include: {
        items: { include: { product: { select: { id: true, name: true, images: true, slug: true } } } },
        payment: { select: { status: true, gateway: true } },
        address: true,
      },
    });
    return res.json({ orders });
  } catch {
    return res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// GET /api/orders/:id
router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const order = await prisma.order.findFirst({
      where: { id: req.params.id, userId: req.user!.id },
      include: {
        items: { include: { product: { select: { id: true, name: true, images: true, slug: true, price: true } } } },
        payment: true,
        address: true,
      },
    });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    return res.json({ order });
  } catch {
    return res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// POST /api/orders - create order
router.post('/', authenticate, [
  body('items').isArray({ min: 1 }),
  body('addressId').notEmpty(),
  body('paymentMethod').notEmpty(),
], async (req: AuthRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { items, addressId, couponCode, notes } = req.body;

  try {
    // Verify address belongs to user
    const address = await prisma.address.findFirst({ where: { id: addressId, userId: req.user!.id } });
    if (!address) return res.status(400).json({ error: 'Invalid address' });

    // Fetch products and calculate totals
    const productIds = items.map((i: any) => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, isActive: true },
    });

    let subtotal = 0;
    const orderItems = [];
    for (const item of items) {
      const product = products.find((p) => p.id === item.productId);
      if (!product) return res.status(400).json({ error: `Product not found: ${item.productId}` });
      if (product.stock < item.quantity) return res.status(400).json({ error: `Insufficient stock for ${product.name}` });
      const price = product.price * (1 - product.discountPct / 100);
      subtotal += price * item.quantity;
      orderItems.push({ productId: product.id, quantity: item.quantity, price, customization: item.customization });
    }

    // Apply coupon
    let discount = 0;
    if (couponCode) {
      const coupon = await prisma.coupon.findUnique({ where: { code: couponCode.toUpperCase() } });
      if (coupon && coupon.isActive && coupon.usedCount < coupon.maxUses && subtotal >= coupon.minOrder) {
        if (!coupon.expiresAt || coupon.expiresAt > new Date()) {
          discount = coupon.discountPct ? (subtotal * coupon.discountPct / 100) : (coupon.discountAmt || 0);
          if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
          await prisma.coupon.update({ where: { id: coupon.id }, data: { usedCount: { increment: 1 } } });
        }
      }
    }

    const shippingCost = subtotal > 999 ? 0 : 49;
    const total = subtotal - discount + shippingCost;

    // Create order + update stock
    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          userId: req.user!.id, addressId, subtotal, discount, shippingCost, total, couponCode, notes,
          items: { create: orderItems },
        },
        include: { items: true, address: true },
      });

      // Deduct stock
      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }

      // Award loyalty points (1 point per ₹10 spent)
      await tx.user.update({
        where: { id: req.user!.id },
        data: { loyaltyPoints: { increment: Math.floor(total / 10) } },
      });

      return newOrder;
    });

    return res.status(201).json({ order });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to create order' });
  }
});

// PUT /api/orders/:id/cancel
router.put('/:id/cancel', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const order = await prisma.order.findFirst({ where: { id: req.params.id, userId: req.user!.id } });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (!['PENDING', 'CONFIRMED'].includes(order.status)) {
      return res.status(400).json({ error: 'Order cannot be cancelled at this stage' });
    }
    await prisma.order.update({ where: { id: order.id }, data: { status: 'CANCELLED' } });
    return res.json({ message: 'Order cancelled successfully' });
  } catch {
    return res.status(500).json({ error: 'Failed to cancel order' });
  }
});

// Admin: GET all orders
router.get('/admin/all', authenticate, requireAdmin, async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const status = req.query.status as string;

  const where: any = {};
  if (status) where.status = status;

  try {
    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where, skip: (page - 1) * limit, take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, email: true } },
          items: { include: { product: { select: { name: true } } } },
          payment: { select: { status: true, gateway: true } },
        },
      }),
      prisma.order.count({ where }),
    ]);
    return res.json({ orders, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch {
    return res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Admin: PUT order status
router.put('/admin/:id/status', authenticate, requireAdmin, [
  body('status').isIn(['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED']),
], async (req: AuthRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const order = await prisma.order.update({
      where: { id: req.params.id },
      data: {
        status: req.body.status,
        trackingNum: req.body.trackingNum,
        ...(req.body.status === 'DELIVERED' && { deliveredAt: new Date() }),
      },
    });

    // Create notification for user
    await prisma.notification.create({
      data: {
        userId: order.userId, type: 'ORDER_UPDATE',
        title: `Order ${req.body.status === 'SHIPPED' ? 'Shipped! 🚚' : req.body.status === 'DELIVERED' ? 'Delivered! 🎉' : 'Updated'}`,
        body: `Your order #${order.id.slice(-8).toUpperCase()} is now ${order.status.toLowerCase()}.`,
        data: { orderId: order.id },
      },
    });

    return res.json({ order });
  } catch {
    return res.status(500).json({ error: 'Failed to update order status' });
  }
});

export default router;
