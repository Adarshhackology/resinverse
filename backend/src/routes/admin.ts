import { Router, Response } from 'express';
import prisma from '../lib/prisma';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/admin/analytics
router.get('/analytics', authenticate, requireAdmin, async (_req: AuthRequest, res: Response) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const [
      totalRevenue, monthRevenue, lastMonthRevenue,
      totalOrders, monthOrders, lastMonthOrders,
      totalCustomers, monthCustomers,
      totalProducts, lowStockProducts,
      recentOrders, topProducts,
      ordersByStatus,
    ] = await Promise.all([
      // Revenue
      prisma.payment.aggregate({ where: { status: 'PAID' }, _sum: { amount: true } }),
      prisma.payment.aggregate({ where: { status: 'PAID', createdAt: { gte: startOfMonth } }, _sum: { amount: true } }),
      prisma.payment.aggregate({ where: { status: 'PAID', createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } }, _sum: { amount: true } }),
      
      // Orders
      prisma.order.count(),
      prisma.order.count({ where: { createdAt: { gte: startOfMonth } } }),
      prisma.order.count({ where: { createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } } }),
      
      // Customers
      prisma.user.count({ where: { role: 'USER' } }),
      prisma.user.count({ where: { role: 'USER', createdAt: { gte: startOfMonth } } }),
      
      // Products
      prisma.product.count({ where: { isActive: true } }),
      prisma.product.count({ where: { isActive: true, stock: { lt: 5 } } }),
      
      // Recent orders
      prisma.order.findMany({
        take: 10, orderBy: { createdAt: 'desc' },
        include: { user: { select: { name: true, email: true } }, payment: { select: { status: true } } },
      }),
      
      // Top products
      prisma.orderItem.groupBy({
        by: ['productId'],
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 5,
      }),
      
      // Orders by status
      prisma.order.groupBy({ by: ['status'], _count: true }),
    ]);

    const topProductIds = topProducts.map(tp => tp.productId);
    const topProductDetails = await prisma.product.findMany({
      where: { id: { in: topProductIds } },
      select: { id: true, name: true, images: true, price: true },
    });

    const revenueGrowth = lastMonthRevenue._sum.amount
      ? ((monthRevenue._sum.amount || 0) - lastMonthRevenue._sum.amount) / lastMonthRevenue._sum.amount * 100
      : 100;

    const orderGrowth = lastMonthOrders
      ? (monthOrders - lastMonthOrders) / lastMonthOrders * 100
      : 100;

    return res.json({
      revenue: { total: totalRevenue._sum.amount || 0, thisMonth: monthRevenue._sum.amount || 0, growth: revenueGrowth },
      orders: { total: totalOrders, thisMonth: monthOrders, growth: orderGrowth, byStatus: ordersByStatus },
      customers: { total: totalCustomers, thisMonth: monthCustomers },
      products: { total: totalProducts, lowStock: lowStockProducts },
      recentOrders,
      topProducts: topProducts.map(tp => {
        const prod = topProductDetails.find(p => p.id === tp.productId);
        let parsedImages = [];
        if (prod && prod.images) {
          try { parsedImages = JSON.parse(prod.images); } catch(e) {}
        }
        return {
          ...tp,
          product: prod ? { ...prod, images: parsedImages } : null
        };
      }),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// GET /api/admin/users
router.get('/users', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const search = req.query.search as string;

  const where: any = {};
  if (search) where.OR = [
    { name: { contains: search, mode: 'insensitive' } },
    { email: { contains: search, mode: 'insensitive' } },
  ];

  try {
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where, skip: (page - 1) * limit, take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, name: true, email: true, role: true, avatar: true,
          phone: true, loyaltyPoints: true, createdAt: true,
          _count: { select: { orders: true } },
        },
      }),
      prisma.user.count({ where }),
    ]);
    return res.json({ users, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch {
    return res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// PUT /api/admin/users/:id/role
router.put('/users/:id/role', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  const { role } = req.body;
  if (!['USER', 'ADMIN'].includes(role)) return res.status(400).json({ error: 'Invalid role' });
  
  try {
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { role },
      select: { id: true, name: true, email: true, role: true },
    });
    return res.json({ user });
  } catch {
    return res.status(500).json({ error: 'Failed to update user role' });
  }
});

// GET /api/admin/coupons
router.get('/coupons', authenticate, requireAdmin, async (_req: AuthRequest, res: Response) => {
  try {
    const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } });
    return res.json({ coupons });
  } catch {
    return res.status(500).json({ error: 'Failed to fetch coupons' });
  }
});

// POST /api/admin/coupons
router.post('/coupons', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  const { code, description, discountPct, discountAmt, minOrder, maxDiscount, maxUses, expiresAt } = req.body;
  try {
    const coupon = await prisma.coupon.create({
      data: { code: code.toUpperCase(), description, discountPct, discountAmt, minOrder: minOrder || 0, maxDiscount, maxUses: maxUses || 100, expiresAt: expiresAt ? new Date(expiresAt) : null },
    });
    return res.status(201).json({ coupon });
  } catch {
    return res.status(500).json({ error: 'Failed to create coupon' });
  }
});

// ─── MANUAL PAYMENT VERIFICATION ──────────────────────────────────────────────

// GET /api/admin/payments/pending
router.get('/payments/pending', authenticate, requireAdmin, async (_req: AuthRequest, res: Response) => {
  try {
    const payments = await prisma.payment.findMany({
      where: { status: 'PENDING', gateway: 'MANUAL_UPI' },
      include: {
        user: { select: { name: true, email: true } },
        order: { select: { total: true, createdAt: true, id: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    return res.json({ payments });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch pending payments' });
  }
});

// POST /api/admin/payments/:id/verify
router.post('/payments/:id/verify', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  const { action } = req.body; // 'APPROVE' or 'REJECT'
  try {
    const payment = await prisma.payment.findUnique({ where: { id: req.params.id } });
    if (!payment) return res.status(404).json({ error: 'Payment not found' });

    if (action === 'APPROVE') {
      const [updatedPayment, updatedOrder] = await prisma.$transaction([
        prisma.payment.update({
          where: { id: payment.id },
          data: { status: 'PAID' }
        }),
        prisma.order.update({
          where: { id: payment.orderId },
          data: { status: 'CONFIRMED' },
          include: { user: true }
        })
      ]);

      // Send Admin Email Alert (non-blocking)
      import('../lib/mailer').then(({ sendPaymentAdminAlert }) => {
        sendPaymentAdminAlert(
          updatedOrder.id,
          updatedOrder.totalAmount,
          updatedOrder.user.name || 'Customer',
          updatedOrder.user.email,
          updatedOrder.user.phone || ''
        );
      }).catch(e => console.error('Failed to trigger alert:', e));

      return res.json({ success: true, status: 'PAID' });
    } else if (action === 'REJECT') {
      await prisma.$transaction([
        prisma.payment.update({
          where: { id: payment.id },
          data: { status: 'FAILED' }
        }),
        prisma.order.update({
          where: { id: payment.orderId },
          data: { status: 'PAYMENT_FAILED' }
        })
      ]);
      return res.json({ success: true, status: 'FAILED' });
    }

    return res.status(400).json({ error: 'Invalid action' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to verify payment' });
  }
});

export default router;
